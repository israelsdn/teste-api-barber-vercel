/*
  Warnings:

  - Added the required column `cliente_sem_cadastro` to the `agenda` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agenda` ADD COLUMN `cliente_sem_cadastro` VARCHAR(100) NOT NULL;
