-- CreateTable
CREATE TABLE `lab_recap_question_completions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `trace_id` VARCHAR(64) NOT NULL,
    `lab_key` VARCHAR(128) NOT NULL,
    `question_key` VARCHAR(100) NOT NULL,
    `question_index` INTEGER NOT NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT true,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `lab_recap_question_completions_user_id_trace_id_question_key_key`(`user_id`, `trace_id`, `question_key`),
    INDEX `lab_recap_question_completions_user_id_lab_key_updated_at_idx`(`user_id`, `lab_key`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lab_recap_question_completions` ADD CONSTRAINT `lab_recap_question_completions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

