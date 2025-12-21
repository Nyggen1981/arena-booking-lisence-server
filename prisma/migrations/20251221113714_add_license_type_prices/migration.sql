-- CreateTable
CREATE TABLE "LicenseTypePrice" (
    "id" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseTypePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseTypePrice_licenseType_key" ON "LicenseTypePrice"("licenseType");

-- CreateIndex
CREATE INDEX "LicenseTypePrice_licenseType_idx" ON "LicenseTypePrice"("licenseType");
