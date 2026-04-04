/*
  Warnings:

  - You are about to drop the column `category` on the `financial_records` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "financial_records_category_idx";

-- AlterTable
ALTER TABLE "financial_records" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "financial_records_categoryId_idx" ON "financial_records"("categoryId");

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
