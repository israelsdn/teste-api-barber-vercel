/*
  Warnings:

  - You are about to alter the column `produtos` on the `caixa` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Json`.

*/
-- AlterTable
ALTER TABLE `caixa` MODIFY `produtos` JSON NOT NULL;
