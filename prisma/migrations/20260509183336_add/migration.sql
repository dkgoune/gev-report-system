-- AlterTable
ALTER TABLE "bordereaux_non_conformes" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "classement_colis" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "colis_hors_bordereaux" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "colis_non_identifies" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "colis_non_vus" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "colis_retardes" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "colis_transferes" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "convoyeurs_absents" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "daily_general_reports" ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "erreurs_destination" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AlterTable
ALTER TABLE "vehicules_embarques" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readById" TEXT;

-- AddForeignKey
ALTER TABLE "daily_general_reports" ADD CONSTRAINT "daily_general_reports_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_non_vus" ADD CONSTRAINT "colis_non_vus_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_hors_bordereaux" ADD CONSTRAINT "colis_hors_bordereaux_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erreurs_destination" ADD CONSTRAINT "erreurs_destination_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_retardes" ADD CONSTRAINT "colis_retardes_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_non_identifies" ADD CONSTRAINT "colis_non_identifies_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis_transferes" ADD CONSTRAINT "colis_transferes_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classement_colis" ADD CONSTRAINT "classement_colis_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convoyeurs_absents" ADD CONSTRAINT "convoyeurs_absents_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bordereaux_non_conformes" ADD CONSTRAINT "bordereaux_non_conformes_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicules_embarques" ADD CONSTRAINT "vehicules_embarques_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
