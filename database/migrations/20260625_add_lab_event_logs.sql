-- CreateTable
CREATE TABLE `lab_event_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `trace_id` VARCHAR(64) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `lab_id` BIGINT UNSIGNED NULL,
    `lab_key` VARCHAR(128) NOT NULL,
    `variant_key` VARCHAR(32) NOT NULL,
    `phase` VARCHAR(32) NOT NULL,
    `event_type` VARCHAR(64) NOT NULL,
    `actor_perspective` VARCHAR(32) NOT NULL,
    `method` VARCHAR(16) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `input_summary_json` JSON NULL,
    `decision` VARCHAR(32) NOT NULL,
    `signal` VARCHAR(100) NOT NULL,
    `status_code` INTEGER NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `risk_level` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lab_event_logs_trace_id_idx`(`trace_id`),
    INDEX `lab_event_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `lab_event_logs_lab_key_variant_key_created_at_idx`(`lab_key`, `variant_key`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lab_event_logs` ADD CONSTRAINT `lab_event_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_event_logs` ADD CONSTRAINT `lab_event_logs_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
