-- CreateTable
CREATE TABLE IF NOT EXISTS `sql_injection_lab_products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(64) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `price_cents` INTEGER NOT NULL,
    `internal_note` VARCHAR(255) NULL,
    `is_hidden` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sql_injection_lab_products_sku_key`(`sku`),
    INDEX `sql_injection_lab_products_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed controlled lab rows.
INSERT INTO `sql_injection_lab_products`
    (`sku`, `name`, `category`, `price_cents`, `internal_note`, `is_hidden`, `is_deleted`)
VALUES
    ('LAB-SQL-ROUTER-01', 'Training Router', 'network', 129900, '公开商品，正常搜索可见。', false, false),
    ('LAB-SQL-FIREWALL-02', 'Branch Firewall', 'network', 259900, '公开商品，正常搜索可见。', false, false),
    ('LAB-SQL-HIDDEN-99', 'Executive Contract Bundle', 'internal', 999900, '隐藏采购条款：仅内部审批可见。', true, false),
    ('LAB-SQL-DELETED-88', 'Retired VPN Appliance', 'archive', 159900, '已删除归档记录，正常业务不应返回。', true, true)
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `category` = VALUES(`category`),
    `price_cents` = VALUES(`price_cents`),
    `internal_note` = VALUES(`internal_note`),
    `is_hidden` = VALUES(`is_hidden`),
    `is_deleted` = VALUES(`is_deleted`);
