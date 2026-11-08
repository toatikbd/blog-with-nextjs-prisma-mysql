-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'SPAM') NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX `Comment_status_createdAt_idx` ON `Comment`(`status`, `createdAt`);
