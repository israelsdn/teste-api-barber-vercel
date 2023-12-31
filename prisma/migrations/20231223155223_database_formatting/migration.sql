/*
  Warnings:

  - A unique constraint covering the columns `[login]` on the table `barbeiro` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `barbearia` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `login` to the `barbeiro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senha_hash` to the `barbeiro` table without a default value. This is not possible if the table is not empty.
  - Made the column `clienteId` on table `caixa` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthdate` on table `cliente` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `servico` to the `produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `barbearia` MODIFY `status` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `barbeiro` ADD COLUMN `login` VARCHAR(255) NOT NULL,
    ADD COLUMN `senha_hash` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `caixa` MODIFY `clienteId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `quantidade_cortes` INTEGER NOT NULL DEFAULT 0,
    MODIFY `birthdate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `produto` ADD COLUMN `servico` BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `barbeiro_login_key` ON `barbeiro`(`login`);
