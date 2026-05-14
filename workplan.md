## Plan: Multi-Tenant Work Schedule Reporting System – Schema Redesign from Scratch

**TL;DR**: Build a schema around Agencies (tenants), Services and Posts (agency-owned configuration), WorkSchedules and Assignments (operational units), and Incident Templates with versioning (dynamic schema). Reports store both data and schema snapshots so they remain immutable and renderable over time.

**Steps**

### Phase 1: Tenant & Identity Foundation

1. Create `Agency` (name, code, isActive, timestamps)
2. Create `User` (username, password, fullName, phone, systemRole=standard|super_admin)
3. Create `UserAgencyMembership` (userId, agencyId, role=admin|scheduler|reporter|worker, unique constraint on pair)
4. Update `SessionPayload` to carry `activeAgencyId` and `activeMembershipRole` instead of single role

### Phase 2: Agency-Scoped Configuration

1. Create `ServiceDefinition` (agencyId, name, code, description, isActive, createdById)
2. Create `Post` (agencyId, name, code, description, isActive, createdById)
3. Migrate `Criterion` to add agencyId; migrate `AttendanceCriterionSetting` to add agencyId
4. Both models now live inside agency scope, not globally

### Phase 3: Scheduling & Operational Structure

1. Create `WorkSchedule` (agencyId, serviceId, workDate, status=draft|published|archived, createdById, unique on agency+service+date)
2. Create `WorkScheduleAssignment` (workScheduleId, userId, postId, isLeader, isSubleader, attendanceStatus, unique on workSchedule+user)
3. Migrate `PersonnelEvaluation` to reference workScheduleId instead of groupId

### Phase 4: Dynamic Incident Template System

1. Create `IncidentTemplate` (agencyId, name, code, description, isActive, createdById, unique on agency+code)
2. Create `IncidentTemplateVersion` (templateId, version, fieldsJson, status=draft|published|archived, publishedAt, createdById; unique on template+version)
   - fieldsJson schema includes: key, label, type, required, minLength, maxLength, minValue, maxValue, options, placeholder, helpText, order
3. Create `ServiceIncidentBinding` (serviceId, templateId, templateVersionId, minEntries, maxEntries, isRequired, displayOrder, unique on service+template)

### Phase 5: Schedule Incident Snapshot

1. Create `WorkScheduleIncidentRequirement` (workScheduleId, serviceIncidentBindingId, templateId, templateVersionId, configSnapshotJson, displayOrder)
   - Snapshot taken at schedule creation to prevent form drift after planning

### Phase 6: General Report & Incident Entries

1. Create `GeneralReport` (workScheduleId, reportedById, readById, isRead, readAt, personnelPresent, personnelAbsent, ambianceGenerale, problemesRencontres, etatGeneralService, passationService, observationGeneral; unique on workScheduleId)
2. Create `GeneralReportIncidentEntry` (generalReportId, workScheduleId, templateId, templateVersionId, templateNameSnapshot, templateCodeSnapshot, valuesJson, schemaSnapshotJson, displayOrder)
   - valuesJson: submitted field answers
   - schemaSnapshotJson: exact field schema used when submitted
3. Delete all hardcoded incident tables (ColisNonVu, ColisHorsBordereau, ErreurDestination, ColisRetarde, ColisNonIdentifie, ColisTransfere, ConvoyeurAbsent, BordereauNonConforme, VehiculeEmbarque)

### Phase 7: Session & Authorization Layer

1. Update session creation/verification to resolve UserAgencyMembership and carry activeAgencyId + activeMembershipRole
2. Update all authorization checks to validate against membership + system role
3. Add super_admin bypass logic for agency switching

**Relevant files** (for reference after implementation)

- schema.prisma — will replace Group, Service enum, and all incident tables
- session.ts — will carry activeAgencyId instead of groupId/groupService
- authz.ts — will check membership role + system role
- user-scope.ts — will scope queries by agencyId, not groupId

**Verification**

1. Check that every operational model has agencyId foreign key
2. Check that User has no agency affinity (membership handles it)
3. Check that incidents are JSON-backed with schema + value snapshots
4. Check that WorkSchedule uniqueness prevents duplicate day+service combos per agency
5. Check that WorkScheduleIncidentRequirement snapshots exist before GeneralReport can be created

**Decisions**

- **Tenancy**: Agency is hard boundary; super_admin switches explicitly.
- **Snapshot strategy**: Service incident config → schedule snapshot → report snapshot. Prevents form drift.
- **Incident storage**: JSON values + schema, not EAV. Simpler to evolve, easier to understand history.
- **Leadership**: Schedule-scoped flags, not permanent roles.
- **Attendance**: From WorkScheduleAssignments, not user groups.
- **One report per schedule**: Enforced by unique constraint to prevent confusion.

**Further Considerations** (optional, not blocking schema):

1. Do you want soft-delete support (isActive flags) or hard deletion? Currently sketched with isActive for safety.
2. Do you need audit logging (who changed what when) or just createdBy + createdAt? Currently only createdBy/timestamps.
3. Should templateVersionId on ServiceIncidentBinding auto-increment when a new version is published, or require manual rebinding? (Suggest: auto-advance if not explicitly frozen.)
