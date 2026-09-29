-- 管理端操作审计表（独立管理端重建，见主项目 docs/execution/2026-09-16-admin-management-rebuild.md 4.5 节）。
--
-- admin_user_id 可空且不加外键：登录失败时没有确定用户；
-- 不加外键也避免管理端反向约束主项目 users 表。
-- before_json / after_json 只存 {"isEnabled": boolean}，不存请求体。
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(32) NOT NULL,
  `target_key` VARCHAR(160) NOT NULL,
  `before_json` JSON NULL,
  `after_json` JSON NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  KEY `admin_audit_logs_created_at_idx` (`created_at`),
  KEY `admin_audit_logs_action_created_at_idx` (`action`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
