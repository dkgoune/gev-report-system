# AGENCY DAILY REPORTING & PERSONNEL EVALUATION SYSTEM

## PROJECT PURPOSE

### In One Sentence

A simple web application that replaces the agency's paper forms and manual counting with digital tools for daily reporting, slip signature tracking, and staff evaluation.

---

### What It Does

**Before (Paper):**

- Leaders fill paper forms at the end of each day
- Agents draw strokes next to their names on paper to count signed slips
- Staff scores are calculated manually from attendance sheets
- Finding old reports means digging through folders

**After (Digital):**

- Leaders fill the same forms on a computer, tablet, or phone
- Leaders or designated operators record each slip signature digitally — the system counts automatically
- Staff scores are calculated automatically based on rules the admin defines
- Old reports are found by typing a date or keyword

---

### Three Main Functions

**1. Daily Reporting**
Leaders record what happened during the day: who was present or absent, problems encountered, missing parcels, wrong destinations, delayed items, vehicle departures, and any other observations. Each service (Envoi, Piste, Retrait) has its own forms matching their existing paper templates.

**2. Slip Signature Counting**
Instead of drawing strokes on paper, leaders or designated operators record each signed slip in the system. The platform keeps the count automatically. At any moment, admins and service leaders can see how many slips each agent has signed today or this month.

**3. Personnel Evaluation**
The admin creates evaluation criteria (for example: "Absence = -5 points" or "More than 10 signatures in a day = +3 points"). Leaders apply these criteria to staff members throughout the month. The system automatically calculates a total score for each person, making it clear who deserves rewards and who needs improvement.

---

### What It Is Not

- It does **not** track parcels from sender to receiver
- It does **not** manage vehicle fleets or driver schedules
- It does **not** replace any existing package management system

It is a **reporting tool only**. Staff type information freely without needing the system to "know" about the parcel or vehicle being referenced.

---

### Why It Matters

- **Saves time:** No manual counting, no paper shuffling
- **Reduces errors:** Automatic calculations, no lost papers
- **Increases transparency:** Authorized managers can see reports and scores instantly
- **Enables fairness:** Evaluation is based on recorded facts, not memory
- **Makes history searchable:** Find any past report in seconds

---

### Who Uses It

| Person                                     | What They Do                                                                                   |
| :----------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Admin**                                  | Manages user accounts, creates evaluation criteria, views everything                           |
| **Service Leader** (Envoi, Piste, Retrait) | Fills daily reports for their service, records slip signatures, evaluates staff, views history |

Agents and convoyeurs are tracked in the system for reporting, signature logs, and evaluations, but they do not access the platform directly.

## 1. EXECUTIVE SUMMARY

A lightweight digital logbook that replaces paper-based daily reporting and slip signature tracking at a parcel shipping agency. The system includes a dynamic, criteria-based personnel evaluation module that allows administrators to define custom grading rules without developer intervention.

**Core principle:** Pure reporting. Users type information as free text. The system does not attempt to manage operational entities (parcels, vehicles, journeys). It simply records observations, incidents, and daily notes with enough structure to search, count, and analyze later.

---

## 2. TECH STACK

| Layer              | Technology                        | Rationale                                                                  |
| :----------------- | :-------------------------------- | :------------------------------------------------------------------------- |
| **Framework**      | Next.js 14+ (App Router)          | Server components, server actions, file-based routing, built-in API routes |
| **Language**       | TypeScript                        | Type safety across the full stack                                          |
| **Database ORM**   | Prisma                            | Type-safe database access, auto-generated client, easy migrations          |
| **Database**       | SQLlite                           | Reliable, supports all needed field types (Decimal, Date, Enum)            |
| **Authentication** | NextAuth.js (Auth.js)             | Flexible auth with multiple providers, session management                  |
| **Styling**        | Tailwind CSS                      | Rapid UI development, utility-first, responsive                            |
| **Icons**          | Lucide React                      | Clean, consistent icon set                                                 |
| **Deployment**     | Vercel or self-hosted Node server | Optimized for Next.js                                                      |

---

## 3. USER ROLES & PERMISSIONS

Only `admin` and service leader accounts access the platform directly. `agent` and `convoyeur` remain valid user roles in the database for reporting and evaluation records, but they do not have a dedicated application interface.

| Role (Code)      | Role (French UI)     | Access Level                                                                                                                               |
| :--------------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`          | Administrateur       | Full system access. Manage users, manage evaluation criteria, view all reports and summaries.                                              |
| `leader_envoi`   | Chef Service Envoi   | Submit daily general report (Envoi), submit all Envoi-specific incident reports, record slip signatures, evaluate personnel, view history. |
| `leader_piste`   | Chef Service Piste   | Submit daily general report (Piste), submit Piste-specific reports, evaluate personnel, view history.                                      |
| `leader_retrait` | Chef Service Retrait | Submit daily general report (Retrait), submit Retrait-specific reports, evaluate personnel, view history.                                  |
| `agent`          | Agent                | Referenced in signatures and evaluation records. No direct platform access.                                                                |
| `convoyeur`      | Convoyeur            | Referenced in personnel and reporting data. No direct platform access.                                                                     |

---

## 4. DATABASE MODEL

### 4.1 Users

**Table: `users`**

Stores all system users regardless of role.

| Column      | Type     | Constraints               | Description                                                                     |
| :---------- | :------- | :------------------------ | :------------------------------------------------------------------------------ |
| `id`        | String   | PK, CUID                  | Unique identifier                                                               |
| `fullName`  | String   | NOT NULL                  | Full name as displayed in French UI                                             |
| `role`      | Enum     | NOT NULL, DEFAULT `agent` | `admin`, `leader_envoi`, `leader_piste`, `leader_retrait`, `agent`, `convoyeur` |
| `phone`     | String   | NULLABLE                  | Contact phone number                                                            |
| `isActive`  | Boolean  | DEFAULT `true`            | Soft disable for departed personnel                                             |
| `createdAt` | DateTime | AUTO                      | Account creation timestamp                                                      |
| `updatedAt` | DateTime | AUTO                      | Last modification timestamp                                                     |

**Relations:**

- One user reports many daily general reports
- One user creates many incident reports (all types)
- One user has many signature log entries
- One user receives many evaluations
- One user records many evaluations (as leader)
- One user creates many criteria (as admin)

---

### 4.2 Daily General Report

**Table: `daily_general_reports`**

One row per service per day. Maps directly to the "ÉLÉMENTS GÉNÉRAL" section appearing on all three paper forms (Envoi, Piste, Retrait).

| Column                | Type     | Constraints    | Description                                 |
| :-------------------- | :------- | :------------- | :------------------------------------------ |
| `id`                  | String   | PK, CUID       |                                             |
| `reportDate`          | Date     | NOT NULL       | The date this report covers                 |
| `service`             | Enum     | NOT NULL       | `envoi`, `piste`, `retrait`                 |
| `personnelPresent`    | Text     | NULLABLE       | Free text listing present staff             |
| `personnelAbsent`     | Text     | NULLABLE       | Free text listing absent staff              |
| `ambianceGenerale`    | Text     | NULLABLE       | Notes on team atmosphere                    |
| `problemesRencontres` | Text     | NULLABLE       | Problems encountered during the day         |
| `etatGeneralService`  | Text     | NULLABLE       | Cleanliness, equipment functionality        |
| `passationService`    | Text     | NULLABLE       | Shift handover notes                        |
| `observationGeneral`  | Text     | NULLABLE       | Personal remarks or improvement suggestions |
| `createdAt`           | DateTime | AUTO           | Submission timestamp                        |
| `reportedById`        | String   | FK -> users.id | Leader who submitted the report             |

**Constraint:** Unique combination of `(reportDate, service)` — only one report per service per day.

---

### 4.3 Incident Reports

All incident report tables follow the same pattern: standalone records with free-text fields. No foreign keys to operational entities like parcels or vehicles.

#### 4.3.1 Colis Non Vus (Unseen Parcels) — `colis_non_vus`

Used by both Envoi and Piste services.

| Column              | Type                    |
| :------------------ | :---------------------- |
| `id`                | String (PK, CUID)       |
| `reportDate`        | Date                    |
| `service`           | Enum (`envoi`, `piste`) |
| `immatriculation`   | String?                 |
| `agenceDepart`      | String?                 |
| `description`       | Text?                   |
| `destinataire`      | String?                 |
| `destinatairePhone` | String?                 |
| `actionEnCours`     | Text?                   |
| `reportedById`      | String (FK)             |
| `createdAt`         | DateTime                |

---

#### 4.3.2 Colis Hors Bordereaux (Parcels Outside Manifests) — `colis_hors_bordereaux`

Used by Envoi and Retrait services.

| Column              | Type        |
| :------------------ | :---------- |
| `id`                | String (PK) |
| `reportDate`        | Date        |
| `agenceDepart`      | String?     |
| `description`       | Text?       |
| `destinataire`      | String?     |
| `destinatairePhone` | String?     |
| `actionMenee`       | Text?       |
| `reportedById`      | String (FK) |

---

#### 4.3.3 Erreurs de Destination (Misrouted Parcels) — `erreurs_destination`

Used by Envoi, Piste, and Retrait services.

| Column               | Type        |
| :------------------- | :---------- |
| `id`                 | String (PK) |
| `reportDate`         | Date        |
| `immatriculation`    | String?     |
| `destination`        | String?     |
| `description`        | Text?       |
| `destinationPrevue`  | String?     |
| `destinationErronee` | String?     |
| `destinataire`       | String?     |
| `destinatairePhone`  | String?     |
| `equipeFacturation`  | String?     |
| `reportedById`       | String (FK) |

---

#### 4.3.4 Colis Retardés (Delayed Parcels) — `colis_retardes`

Used by Piste service.

| Column          | Type        |
| :-------------- | :---------- |
| `id`            | String (PK) |
| `reportDate`    | Date        |
| `codeColis`     | String?     |
| `description`   | Text?       |
| `destinataire`  | String?     |
| `motifRetard`   | Text?       |
| `actionEnCours` | Text?       |
| `reportedById`  | String (FK) |

---

#### 4.3.5 Colis Non Identifiés (Unidentified Parcels) — `colis_non_identifies`

Used by Piste service.

| Column                   | Type        |
| :----------------------- | :---------- |
| `id`                     | String (PK) |
| `reportDate`             | Date        |
| `descriptionColis`       | Text?       |
| `motifNonIdentification` | Text?       |
| `actionMenee`            | Text?       |
| `reportedById`           | String (FK) |

---

#### 4.3.6 Colis Transférés (Transferred Parcels) — `colis_transferes`

Used by Piste service.

| Column            | Type        |
| :---------------- | :---------- |
| `id`              | String (PK) |
| `reportDate`      | Date        |
| `destination`     | String?     |
| `numeroBordereau` | String?     |
| `nombreColis`     | Int?        |
| `chauffeur`       | String?     |
| `statut`          | String?     |
| `reportedById`    | String (FK) |

---

#### 4.3.7 Classement des Colis (Parcel Sorting) — `classement_colis`

Used by Envoi service. Tracks sorting of specific item types (ballots, mattresses) and movement to mezzanine before 15h.

| Column            | Type                     |
| :---------------- | :----------------------- |
| `id`              | String (PK)              |
| `reportDate`      | Date                     |
| `typeColis`       | String?                  |
| `emplacement`     | String?                  |
| `deplaceAvant15h` | Boolean (default: false) |
| `notes`           | Text?                    |
| `reportedById`    | String (FK)              |

---

#### 4.3.8 Convoyeurs Absents (Absent Convoyers) — `convoyeurs_absents`

Used by Envoi service.

| Column             | Type        |
| :----------------- | :---------- |
| `id`               | String (PK) |
| `reportDate`       | Date        |
| `nom`              | String?     |
| `numero`           | String?     |
| `vehicule`         | String?     |
| `agenceProvenance` | String?     |
| `reportedById`     | String (FK) |

---

#### 4.3.9 Bordereaux Non Conformes (Non-Compliant Slips) — `bordereaux_non_conformes`

Used by Envoi service.

| Column               | Type        |
| :------------------- | :---------- |
| `id`                 | String (PK) |
| `reportDate`         | Date        |
| `numeroBordereau`    | String?     |
| `motifNonConformite` | Text?       |
| `actionMenee`        | Text?       |
| `reportedById`       | String (FK) |

---

#### 4.3.10 Véhicules Embarqués (Loaded Vehicles) — `vehicules_embarques`

Used by Piste service. Logs vehicle loading and departure.

| Column                 | Type        |
| :--------------------- | :---------- |
| `id`                   | String (PK) |
| `reportDate`           | Date        |
| `immatriculation`      | String?     |
| `destination`          | String?     |
| `heure`                | DateTime?   |
| `retourReceptionColis` | Text?       |
| `presenceConvoyeurs`   | Text?       |
| `reportedById`         | String (FK) |

---

### 4.4 Slip Signature Tracking

**Table: `signature_log`**

The digital replacement for the paper stroke counting system. Every time an agent signs a slip (bordereau), one row is inserted.

| Column       | Type     | Constraints    | Description                                                        |
| :----------- | :------- | :------------- | :----------------------------------------------------------------- |
| `id`         | String   | PK, CUID       |                                                                    |
| `userId`     | String   | FK -> users.id | The agent who signed                                               |
| `slipNumber` | String   | NOT NULL       | The slip number as typed — not linked to any slip management table |
| `signedAt`   | DateTime | AUTO           | Exact timestamp of signature                                       |

**Key queries:**

- Daily count per agent: Count rows where `userId = X` and `DATE(signedAt) = today`
- Monthly count per agent: Count rows where `userId = X` and `MONTH(signedAt) = month`

---

### 4.5 Dynamic Criteria & Evaluation System

#### 4.5.1 Criteria Definition — `criteria`

Administrators define evaluation rules here. Rules can be added, modified, or disabled without any code changes.

| Column          | Type         | Constraints    | Description                                               |
| :-------------- | :----------- | :------------- | :-------------------------------------------------------- |
| `id`            | String       | PK, CUID       |                                                           |
| `name`          | String       | NOT NULL       | e.g., "Absence", "Retard > 30 min", "10+ signatures/jour" |
| `impact`        | Enum         | NOT NULL       | `POSITIVE` or `NEGATIVE`                                  |
| `defaultWeight` | Decimal(5,2) | NOT NULL       | e.g., `-5.00` for absence, `+3.00` for high performance   |
| `isActive`      | Boolean      | DEFAULT `true` | Soft disable without deletion                             |
| `createdAt`     | DateTime     | AUTO           |                                                           |
| `createdById`   | String       | FK -> users.id | Admin who created the criterion                           |

**Examples:**
| Name | Impact | Default Weight |
| :--- | :--- | :--- |
| Absence non justifiée | NEGATIVE | -5.00 |
| Retard (plus de 30 minutes) | NEGATIVE | -2.00 |
| 10 signatures de bordereaux ou plus par jour | POSITIVE | +3.00 |
| Code de conduite exemplaire | POSITIVE | +1.00 |
| Colis mal orienté | NEGATIVE | -3.00 |

---

#### 4.5.2 Personnel Evaluations — `personnel_evaluations`

Records each application of a criterion to a specific person on a specific date.

| Column           | Type          | Constraints       | Description                                                |
| :--------------- | :------------ | :---------------- | :--------------------------------------------------------- |
| `id`             | String        | PK, CUID          |                                                            |
| `userId`         | String        | FK -> users.id    | The person being evaluated                                 |
| `criteriaId`     | String        | FK -> criteria.id | The criterion being applied                                |
| `evaluationDate` | Date          | NOT NULL          | The date of the incident/achievement                       |
| `weightOverride` | Decimal(5,2)? | NULLABLE          | Optional override of `defaultWeight` for exceptional cases |
| `notes`          | Text?         | NULLABLE          | Leader's comments or justification                         |
| `recordedById`   | String        | FK -> users.id    | The leader who recorded this evaluation                    |
| `createdAt`      | DateTime      | AUTO              |                                                            |

**Effective weight calculation:**

```
COALESCE(weightOverride, criteria.defaultWeight)
```

This means: use the override if the leader provided one, otherwise use the criterion's default weight.

---

### 4.6 Entity Relationship Summary

```
users
  ├── daily_general_reports (one user reports many)
  ├── colis_non_vus
  ├── colis_hors_bordereaux
  ├── erreurs_destination
  ├── colis_retardes
  ├── colis_non_identifies
  ├── colis_transferes
  ├── classement_colis
  ├── convoyeurs_absents
  ├── bordereaux_non_conformes
  ├── vehicules_embarques
  ├── signature_log (one user has many signatures)
  ├── personnel_evaluations (received, one user evaluated many times)
  ├── personnel_evaluations (given as leader, one leader records many)
  └── criteria (created by admin)

criteria
  └── personnel_evaluations (one criterion used in many evaluations)
```

---

## 5. CORE FEATURES & USER FLOWS

### 5.1 Daily Report Submission (Chef de Service)

**Workflow:**

1. Leader logs in and lands on the dashboard.
2. System shows today's report status for their service: completed or pending.
3. Leader clicks to open the daily general report form.
4. Form displays all "Éléments Général" fields in French.
5. Leader fills in: present/absent staff, atmosphere, problems, service state, handover notes, general observations.
6. Submits. System saves with `reportDate = today`, `service = leader's service`, `reportedBy = leader's user ID`.
7. Below the general section, leader can access specific incident report forms relevant to their service.

**Services and their forms:**

| Service | Daily General | Specific Forms Available                                                                                                     |
| :------ | :------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Envoi   | Yes           | Colis non vus, Colis hors bordereaux, Erreurs de destination, Classement colis, Convoyeurs absents, Bordereaux non conformes |
| Piste   | Yes           | Véhicules embarqués, Colis non vus, Colis retardés, Colis non identifiés, Colis transférés, Erreurs de destination           |
| Retrait | Yes           | Colis hors bordereaux, Erreurs de destination                                                                                |

---

### 5.2 Slip Signature Recording

**Workflow:**

1. Leader or designated operator opens the signature screen.
2. Selects an agent from a dropdown (list filtered to active users with `role = agent`).
3. Types the slip number (bordereau number) into a text field.
4. Clicks the **"Signer"** button.
5. A row is inserted into `signature_log`. A brief confirmation appears.
6. The screen shows today's count for that agent, updating instantly.

**Design notes:**

- The screen must be fast: minimal fields, large click targets, no page reloads.
- Server Action handles the insertion so the count updates without a full page refresh.
- No validation on slip numbers — this is a log, not a management system. Duplicates are acceptable.

**Counting display:**

- "Signatures aujourd'hui : 27"
- "Signatures ce mois : 312"

---

### 5.3 Criteria Management (Admin)

**Workflow:**

1. Admin navigates to "Gestion des Critères d'Évaluation".
2. Table displays all existing criteria with columns: Name, Impact, Default Weight, Status (Active/Inactive).
3. "Ajouter un critère" button opens a form.
4. Form fields: Name (text), Impact (POSITIVE/NEGATIVE toggle), Default Weight (number), Active (checkbox).
5. Admin submits. New criterion is immediately available for evaluations.
6. Existing criteria can be edited or soft-disabled (isActive = false) without losing historical evaluation data.

---

### 5.4 Personnel Evaluation (Leader)

**Workflow:**

1. Leader navigates to "Évaluation du Personnel" and clicks "Nouvelle évaluation".
2. Selects the agent from a dropdown.
3. Selects the criterion from a dropdown (shows only active criteria, grouped by impact).
4. Selects the evaluation date (defaults to today).
5. Optionally adjusts the weight (override) if the situation warrants deviation from default.
6. Optionally adds notes for context.
7. Submits. Record is created.

---

### 5.5 Monthly Evaluation Summary

**Workflow:**

1. Admin or leader navigates to "Résumé Mensuel".
2. Selects month and year from dropdowns.
3. System calculates total score per agent.
4. Results displayed in a sortable table:

| Agent        | Score Total | Détails                                                           |
| :----------- | :---------- | :---------------------------------------------------------------- |
| Koffi Mensah | +12         | 3x Signatures élevées (+9), 1x Retard (-2), 1x Code conduite (+5) |
| Ama Kévin    | -3          | 1x Absence (-5), 2x Signature élevée (+2)                         |

**Query logic:**

- Filter `personnel_evaluations` by `evaluationDate` within the selected month.
- Join to `criteria` to get `defaultWeight`.
- For each evaluation, use `COALESCE(weightOverride, defaultWeight)`.
- Group by `userId`, sum the effective weights.
- Join to `users` to get names.

---

### 5.6 Historical Report Search

**Workflow:**

1. Leader or admin navigates to a report type (e.g., "Colis non vus").
2. System displays a table of past reports, most recent first.
3. Filters available: date range, keyword search across text fields, reported by.
4. Each row can be expanded for full details.
5. Export to CSV or PDF is possible but optional for initial version.

---

## 6. FRENCH UI LABELS MAP

### 6.1 Navigation

| English                   | French                   |
| :------------------------ | :----------------------- |
| Dashboard                 | Tableau de bord          |
| Daily Reports             | Rapports Journaliers     |
| General Report            | Rapport Général          |
| Unseen Parcels            | Colis Non Vus            |
| Parcels Outside Manifests | Colis Hors Bordereaux    |
| Destination Errors        | Erreurs de Destination   |
| Delayed Parcels           | Colis Retardés           |
| Unidentified Parcels      | Colis Non Identifiés     |
| Transferred Parcels       | Colis Transférés         |
| Parcel Sorting            | Classement des Colis     |
| Absent Convoyers          | Convoyeurs Absents       |
| Non-Compliant Slips       | Bordereaux Non Conformes |
| Loaded Vehicles           | Véhicules Embarqués      |
| Slip Signatures           | Signatures de Bordereaux |
| Evaluations               | Évaluations              |
| Criteria Management       | Gestion des Critères     |
| Monthly Summary           | Résumé Mensuel           |
| Personnel                 | Gestion du Personnel     |

---

### 6.2 Forms

| English                   | French                            |
| :------------------------ | :-------------------------------- |
| Date                      | Date                              |
| Service                   | Service                           |
| Staff Present             | État du personnel présent         |
| Staff Absent              | État du personnel absent          |
| General Atmosphere        | Ambiance générale entre collègues |
| Problems Encountered      | Problèmes rencontrés              |
| General Service State     | État général du service           |
| Shift Handover            | Passation de service              |
| General Observation       | Observation général               |
| Vehicle Registration      | Immatriculation                   |
| Departure Agency          | Agence départ                     |
| Description               | Description                       |
| Recipient                 | Destinataire                      |
| Phone Number              | N° de téléphone                   |
| Action In Progress        | Action en cours                   |
| Action Taken              | Action menée                      |
| Intended Destination      | Destination prévue                |
| Wrong Destination         | Destination erronée               |
| Billing Team              | Équipe de facturation             |
| Parcel Code               | Code colis                        |
| Delay Reason              | Motif du retard                   |
| Non-Identification Reason | Motif de non identification       |
| Slip Number               | Numéro de bordereau               |
| Number of Parcels         | Nombre de colis                   |
| Driver                    | Chauffeur                         |
| Status                    | Statut                            |
| Parcel Type               | Type de colis                     |
| Location                  | Emplacement                       |
| Moved Before 3PM          | Déplacé avant 15h                 |
| Origin Agency             | Agence de provenance              |
| Non-Compliance Reason     | Motif de non-conformité           |
| Departure Time            | Heure                             |
| Return/Reception          | Retour de réception des colis     |
| Convoyer Presence         | Présence de convoyeurs            |
| Criterion                 | Critère                           |
| Impact                    | Impact                            |
| Weight                    | Poids                             |
| Positive                  | Positif                           |
| Negative                  | Négatif                           |
| Active                    | Actif                             |
| Override Weight           | Poids personnalisé                |
| Notes                     | Notes                             |

---

### 6.3 Buttons & Actions

| English           | French                   |
| :---------------- | :----------------------- |
| Save Report       | Enregistrer le rapport   |
| Sign              | Signer                   |
| Add               | Ajouter                  |
| Edit              | Modifier                 |
| Disable           | Désactiver               |
| New Evaluation    | Nouvelle évaluation      |
| Record Evaluation | Enregistrer l'évaluation |
| Search            | Rechercher               |
| Export            | Exporter                 |
| Log In            | Se connecter             |
| Log Out           | Se déconnecter           |

---

## 7. KEY TECHNICAL DECISIONS

### 7.1 Why Server Actions Over API Routes

Server Actions (Next.js 14+) allow form submissions to call server-side functions directly without creating separate API endpoints. This reduces boilerplate and keeps the codebase simple for a reporting-focused application with primarily form-based interactions.

```typescript
// Example: Submitting a Colis Non Vu report
"use server";

export async function createColisNonVu(data: {
  reportDate: Date;
  service: "envoi" | "piste";
  immatriculation?: string;
  agenceDepart?: string;
  description?: string;
  destinataire?: string;
  destinatairePhone?: string;
  actionEnCours?: string;
}) {
  const session = await getSession();
  return prisma.colisNonVu.create({
    data: {
      ...data,
      reportedById: session.user.id,
    },
  });
}
```

### 7.2 Why Prisma Over Raw SQL

- Type safety: The generated client provides full TypeScript types for every model and query.
- Migrations: `prisma migrate dev` generates SQL migration files automatically.
- Relations: Easy to query related data (e.g., user with their evaluations) without writing JOINs manually.

### 7.3 Why Free Text Over Foreign Keys for Reports

This is the core design philosophy. The system does **not** manage parcels, vehicles, or journeys. Those systems exist elsewhere or are managed manually. By using free text, the system:

- Avoids creating incomplete or duplicate operational records.
- Requires no data migration or integration with external systems.
- Allows users to report anything, even if the referenced entity is unknown to the system.
- Keeps the database schema simple and the codebase maintainable.

---

## 8. PRISMA SCHEMA

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ==================== USERS ====================

model User {
  id        String   @id @default(cuid())
  fullName  String
  role      Role     @default(agent)
  phone     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  generalReports          DailyGeneralReport[]      @relation("GeneralReportReporter")
  colisNonVus             ColisNonVu[]
  colisHorsBordereaux     ColisHorsBordereau[]
  erreursDestination      ErreurDestination[]
  colisRetardes           ColisRetarde[]
  colisNonIdentifies      ColisNonIdentifie[]
  colisTransferes         ColisTransfere[]
  classementColis         ClassementColi[]
  convoyeursAbsents       ConvoyeurAbsent[]
  bordereauxNonConformes  BordereauNonConforme[]
  vehiculesEmbarques      VehiculeEmbarque[]
  signatureLogs           SignatureLog[]
  evaluationsReceived     PersonnelEvaluation[]     @relation("EvaluatedUser")
  evaluationsGiven        PersonnelEvaluation[]     @relation("EvaluatingLeader")
  criteriaCreated         Criterion[]               @relation("CriteriaCreator")

  @@map("users")
}

enum Role {
  admin
  leader_envoi
  leader_piste
  leader_retrait
  agent
  convoyeur
}

// ==================== DAILY GENERAL REPORT ====================

model DailyGeneralReport {
  id                   String   @id @default(cuid())
  reportDate           DateTime @db.Date
  service              Service
  personnelPresent     String?  @db.Text
  personnelAbsent      String?  @db.Text
  ambianceGenerale     String?  @db.Text
  problemesRencontres  String?  @db.Text
  etatGeneralService   String?  @db.Text
  passationService     String?  @db.Text
  observationGeneral   String?  @db.Text
  createdAt            DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation("GeneralReportReporter", fields: [reportedById], references: [id])

  @@unique([reportDate, service])
  @@map("daily_general_reports")
}

enum Service {
  envoi
  piste
  retrait
}

// ==================== INCIDENT REPORTS ====================

model ColisNonVu {
  id                String   @id @default(cuid())
  reportDate        DateTime @db.Date
  service           Service
  immatriculation   String?
  agenceDepart      String?
  description       String?  @db.Text
  destinataire      String?
  destinatairePhone String?
  actionEnCours     String?  @db.Text
  createdAt         DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("colis_non_vus")
}

model ColisHorsBordereau {
  id                String   @id @default(cuid())
  reportDate        DateTime @db.Date
  agenceDepart      String?
  description       String?  @db.Text
  destinataire      String?
  destinatairePhone String?
  actionMenee       String?  @db.Text
  createdAt         DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("colis_hors_bordereaux")
}

model ErreurDestination {
  id                 String   @id @default(cuid())
  reportDate         DateTime @db.Date
  immatriculation    String?
  destination        String?
  description        String?  @db.Text
  destinationPrevue  String?
  destinationErronee String?
  destinataire       String?
  destinatairePhone  String?
  equipeFacturation  String?
  createdAt          DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("erreurs_destination")
}

model ColisRetarde {
  id            String   @id @default(cuid())
  reportDate    DateTime @db.Date
  codeColis     String?
  description   String?  @db.Text
  destinataire  String?
  motifRetard   String?  @db.Text
  actionEnCours String?  @db.Text
  createdAt     DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("colis_retardes")
}

model ColisNonIdentifie {
  id                      String   @id @default(cuid())
  reportDate              DateTime @db.Date
  descriptionColis        String?  @db.Text
  motifNonIdentification  String?  @db.Text
  actionMenee             String?  @db.Text
  createdAt               DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("colis_non_identifies")
}

model ColisTransfere {
  id              String   @id @default(cuid())
  reportDate      DateTime @db.Date
  destination     String?
  numeroBordereau String?
  nombreColis     Int?
  chauffeur       String?
  statut          String?
  createdAt       DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("colis_transferes")
}

model ClassementColi {
  id               String   @id @default(cuid())
  reportDate       DateTime @db.Date
  typeColis        String?
  emplacement      String?
  deplaceAvant15h  Boolean  @default(false)
  notes            String?  @db.Text
  createdAt        DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("classement_colis")
}

model ConvoyeurAbsent {
  id               String   @id @default(cuid())
  reportDate       DateTime @db.Date
  nom              String?
  numero           String?
  vehicule         String?
  agenceProvenance String?
  createdAt        DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("convoyeurs_absents")
}

model BordereauNonConforme {
  id                 String   @id @default(cuid())
  reportDate         DateTime @db.Date
  numeroBordereau    String?
  motifNonConformite String?  @db.Text
  actionMenee        String?  @db.Text
  createdAt          DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("bordereaux_non_conformes")
}

model VehiculeEmbarque {
  id                   String   @id @default(cuid())
  reportDate           DateTime @db.Date
  immatriculation      String?
  destination          String?
  heure                DateTime?
  retourReceptionColis String?  @db.Text
  presenceConvoyeurs   String?  @db.Text
  createdAt            DateTime @default(now())

  reportedById  String
  reportedBy    User     @relation(fields: [reportedById], references: [id])

  @@map("vehicules_embarques")
}

// ==================== SLIP SIGNATURES ====================

model SignatureLog {
  id         String   @id @default(cuid())
  slipNumber String
  signedAt   DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id])

  @@map("signature_log")
}

// ==================== EVALUATION SYSTEM ====================

model Criterion {
  id            String   @id @default(cuid())
  name          String
  impact        Impact
  defaultWeight Decimal  @db.Decimal(5, 2)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  createdById  String
  createdBy    User                    @relation("CriteriaCreator", fields: [createdById], references: [id])
  evaluations  PersonnelEvaluation[]

  @@map("criteria")
}

enum Impact {
  POSITIVE
  NEGATIVE
}

model PersonnelEvaluation {
  id              String   @id @default(cuid())
  evaluationDate  DateTime @db.Date
  weightOverride  Decimal? @db.Decimal(5, 2)
  notes           String?  @db.Text
  createdAt       DateTime @default(now())

  userId       String
  user         User       @relation("EvaluatedUser", fields: [userId], references: [id])
  criteriaId   String
  criteria     Criterion  @relation(fields: [criteriaId], references: [id])
  recordedById String
  recordedBy   User       @relation("EvaluatingLeader", fields: [recordedById], references: [id])

  @@map("personnel_evaluations")
}
```

---

## 9. ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: if using a social login provider
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

---

## 10. DEVELOPMENT SETUP STEPS

1. **Create project:**

   ```bash
   npx create-next-app@latest agency-reports --typescript --tailwind --app
   cd agency-reports
   ```

2. **Install dependencies:**

   ```bash
   npm install @prisma/client next-auth lucide-react
   npm install -D prisma
   ```

3. **Initialize Prisma:**

   ```bash
   npx prisma init
   ```

4. **Replace `prisma/schema.prisma` with the schema provided above.**

5. **Set `DATABASE_URL` in `.env`.**

6. **Push schema to database:**

   ```bash
   npx prisma db push
   ```

7. **Create Prisma client singleton at `src/lib/prisma.ts`:**

   ```typescript
   import { PrismaClient } from "@prisma/client";

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient();

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

8. **Start building pages. Recommended order:**
   - Login page and authentication setup
   - Dashboard layout with sidebar
   - Daily general report form (most important)
   - Signature tool (highest frequency use)
   - Evaluation criteria management (admin)
   - Personnel evaluation form
   - Monthly summary page
   - Remaining incident report forms

---

## 11. TOTAL TABLES SUMMARY

| #   | Table                      | Maps To                                |
| :-- | :------------------------- | :------------------------------------- |
| 1   | `users`                    | All system users                       |
| 2   | `daily_general_reports`    | "Éléments Général" × 3 services        |
| 3   | `colis_non_vus`            | Envoi/Piste: "Colis non vus"           |
| 4   | `colis_hors_bordereaux`    | Envoi/Retrait: "Colis hors bordereaux" |
| 5   | `erreurs_destination`      | All services: "Erreurs de destination" |
| 6   | `colis_retardes`           | Piste: "Colis retardés"                |
| 7   | `colis_non_identifies`     | Piste: "Colis non identifiés"          |
| 8   | `colis_transferes`         | Piste: "Colis transférés"              |
| 9   | `classement_colis`         | Envoi: "Classement des colis"          |
| 10  | `convoyeurs_absents`       | Envoi: "Convoyeurs absents"            |
| 11  | `bordereaux_non_conformes` | Envoi: "Bordereaux non conformes"      |
| 12  | `vehicules_embarques`      | Piste: "Véhicules embarqués"           |
| 13  | `signature_log`            | Digital stroke replacement             |
| 14  | `criteria`                 | Dynamic evaluation rules               |
| 15  | `personnel_evaluations`    | Individual evaluation records          |

**15 tables total. No unnecessary complexity. No entity management. Pure reporting.**
