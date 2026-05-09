-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'leader_envoi', 'leader_piste', 'leader_retrait', 'agent', 'convoyeur');

-- CreateEnum
CREATE TYPE "Service" AS ENUM ('envoi', 'piste', 'retrait');

-- CreateEnum
CREATE TYPE "Impact" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'agent',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_general_reports" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "service" "Service" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "personnelPresent" TEXT,
    "personnelAbsent" TEXT,
    "ambianceGenerale" TEXT,
    "problemesRencontres" TEXT,
    "etatGeneralService" TEXT,
    "passationService" TEXT,
    "observationGeneral" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "daily_general_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis_non_vus" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "service" "Service" NOT NULL,
    "immatriculation" TEXT,
    "agenceDepart" TEXT,
    "description" TEXT,
    "destinataire" TEXT,
    "destinatairePhone" TEXT,
    "actionEnCours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "colis_non_vus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis_hors_bordereaux" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "agenceDepart" TEXT,
    "description" TEXT,
    "destinataire" TEXT,
    "destinatairePhone" TEXT,
    "actionMenee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "colis_hors_bordereaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erreurs_destination" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "immatriculation" TEXT,
    "destination" TEXT,
    "description" TEXT,
    "destinationPrevue" TEXT,
    "destinationErronee" TEXT,
    "destinataire" TEXT,
    "destinatairePhone" TEXT,
    "equipeFacturation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "erreurs_destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis_retardes" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "codeColis" TEXT,
    "description" TEXT,
    "destinataire" TEXT,
    "motifRetard" TEXT,
    "actionEnCours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "colis_retardes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis_non_identifies" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "descriptionColis" TEXT,
    "motifNonIdentification" TEXT,
    "actionMenee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "colis_non_identifies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis_transferes" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "destination" TEXT,
    "numeroBordereau" TEXT,
    "nombreColis" INTEGER,
    "chauffeur" TEXT,
    "statut" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "colis_transferes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classement_colis" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "typeColis" TEXT,
    "emplacement" TEXT,
    "deplaceAvant15h" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "classement_colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convoyeurs_absents" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "nom" TEXT,
    "numero" TEXT,
    "vehicule" TEXT,
    "agenceProvenance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "convoyeurs_absents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bordereaux_non_conformes" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "numeroBordereau" TEXT,
    "motifNonConformite" TEXT,
    "actionMenee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "bordereaux_non_conformes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicules_embarques" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "immatriculation" TEXT,
    "destination" TEXT,
    "heure" TIMESTAMP(3),
    "retourReceptionColis" TEXT,
    "presenceConvoyeurs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,

    CONSTRAINT "vehicules_embarques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_log" (
    "id" TEXT NOT NULL,
    "slipNumber" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "signature_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "impact" "Impact" NOT NULL,
    "defaultWeight" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_evaluations" (
    "id" TEXT NOT NULL,
    "evaluationDate" DATE NOT NULL,
    "weightOverride" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "personnel_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "daily_general_reports_reportDate_service_key" ON "daily_general_reports"("reportDate", "service");

-- AddForeignKey
ALTER TABLE "daily_general_reports" ADD CONSTRAINT "daily_general_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_non_vus" ADD CONSTRAINT "colis_non_vus_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_hors_bordereaux" ADD CONSTRAINT "colis_hors_bordereaux_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erreurs_destination" ADD CONSTRAINT "erreurs_destination_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_retardes" ADD CONSTRAINT "colis_retardes_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_non_identifies" ADD CONSTRAINT "colis_non_identifies_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_transferes" ADD CONSTRAINT "colis_transferes_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classement_colis" ADD CONSTRAINT "classement_colis_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convoyeurs_absents" ADD CONSTRAINT "convoyeurs_absents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bordereaux_non_conformes" ADD CONSTRAINT "bordereaux_non_conformes_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicules_embarques" ADD CONSTRAINT "vehicules_embarques_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_log" ADD CONSTRAINT "signature_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_evaluations" ADD CONSTRAINT "personnel_evaluations_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
