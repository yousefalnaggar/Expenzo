/*
  Warnings:

  - Made the column `normalizedUsdCents` on table `Expense` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "normalizedUsdCents" SET NOT NULL;
