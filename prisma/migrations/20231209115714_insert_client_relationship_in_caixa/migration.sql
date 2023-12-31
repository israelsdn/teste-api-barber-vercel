-- AlterTable
ALTER TABLE `caixa` ADD COLUMN `clienteId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `caixa_clienteId_idx` ON `caixa`(`clienteId`);
