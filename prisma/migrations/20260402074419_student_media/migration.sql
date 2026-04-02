-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "faceMatchScore" DOUBLE PRECISION,
ADD COLUMN     "faceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "faceVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "liveCapturePhotoUrl" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT;
