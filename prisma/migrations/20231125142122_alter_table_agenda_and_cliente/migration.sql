/*
  Warnings:

  - Added the required column `clienteId` to the `agenda` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agenda` ADD COLUMN `clienteId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `agenda_clienteId_idx` ON `agenda`(`clienteId`);
