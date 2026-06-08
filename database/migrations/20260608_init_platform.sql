-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `lab_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lab_key` VARCHAR(128) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `subcategory_code` VARCHAR(128) NOT NULL,
    `mode` VARCHAR(32) NOT NULL,
    `severity` VARCHAR(32) NOT NULL,
    `difficulty` VARCHAR(32) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `phase` VARCHAR(32) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `estimated_minutes` INTEGER NOT NULL DEFAULT 0,
    `meta_version` INTEGER NOT NULL DEFAULT 1,
    `meta_path` VARCHAR(255) NOT NULL,
    `readme_path` VARCHAR(255) NOT NULL,
    `root_path` VARCHAR(255) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `labs_lab_key_key`(`lab_key`),
    UNIQUE INDEX `labs_slug_key`(`slug`),
    INDEX `labs_category_id_sort_order_idx`(`category_id`, `sort_order`),
    INDEX `labs_status_is_enabled_idx`(`status`, `is_enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_variants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lab_id` BIGINT UNSIGNED NOT NULL,
    `variant_key` VARCHAR(32) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `entry_key` VARCHAR(100) NOT NULL,
    `expected_outcome` VARCHAR(255) NOT NULL,
    `supports_automation` BOOLEAN NOT NULL DEFAULT false,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `lab_variants_lab_id_variant_key_key`(`lab_id`, `variant_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tag_code` VARCHAR(64) NOT NULL,
    `tag_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `lab_tags_tag_code_key`(`tag_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_tag_relations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lab_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `lab_tag_relations_lab_id_tag_id_key`(`lab_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_progress` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `lab_id` BIGINT UNSIGNED NOT NULL,
    `current_variant_key` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `started_at` DATETIME(0) NULL,
    `last_viewed_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `learning_progress_user_id_status_idx`(`user_id`, `status`),
    UNIQUE INDEX `learning_progress_user_id_lab_id_key`(`user_id`, `lab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `lab_id` BIGINT UNSIGNED NOT NULL,
    `variant_key` VARCHAR(32) NOT NULL,
    `verification_type` VARCHAR(32) NOT NULL,
    `result` VARCHAR(32) NOT NULL,
    `summary` VARCHAR(255) NOT NULL,
    `details_json` JSON NULL,
    `triggered_by` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `verification_records_lab_id_variant_key_verification_type_cr_idx`(`lab_id`, `variant_key`, `verification_type`, `created_at`),
    INDEX `verification_records_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_run_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `lab_id` BIGINT UNSIGNED NOT NULL,
    `variant_key` VARCHAR(32) NOT NULL,
    `run_type` VARCHAR(32) NOT NULL,
    `entry_key` VARCHAR(100) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `started_at` DATETIME(0) NULL,
    `ended_at` DATETIME(0) NULL,
    `extra_json` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lab_run_records_lab_id_created_at_idx`(`lab_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `labs` ADD CONSTRAINT `labs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `lab_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_variants` ADD CONSTRAINT `lab_variants_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tag_relations` ADD CONSTRAINT `lab_tag_relations_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tag_relations` ADD CONSTRAINT `lab_tag_relations_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `lab_tags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_progress` ADD CONSTRAINT `learning_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_progress` ADD CONSTRAINT `learning_progress_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_records` ADD CONSTRAINT `verification_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_records` ADD CONSTRAINT `verification_records_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_run_records` ADD CONSTRAINT `lab_run_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_run_records` ADD CONSTRAINT `lab_run_records_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
