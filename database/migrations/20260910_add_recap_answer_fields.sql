-- LT-055：为复盘完成记录增加知识点级作答字段
--
-- 背景：原表只有 is_completed，表示「这道题点过」，无法区分答对与答错，
-- 因此掌握度无从判定。本迁移增加三列，使记录能表达「绑定哪个知识点、
-- 选了哪个选项、是否答对」。
--
-- 三列一律可空且不设默认值：既有行保持 NULL，诚实表达「旧记录没有该语义」。
-- 不得用 false 或占位知识点回填，否则会把历史完成记录误判为答错或误归知识点。
--
-- 采用 information_schema 守卫 + 动态 SQL，使每列追加幂等。原因是同一结构
-- 另有 apps/server/scripts/ensure-local-schema.mjs 作为旧库补齐入口，两条路径
-- 可能以任意顺序执行；MySQL 不支持 ADD COLUMN IF NOT EXISTS，故显式判存。

-- knowledge_point：meta.json knowledgePoints[] 的完整原文，不另编 slug
SET @add_knowledge_point := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `lab_recap_question_completions` ADD COLUMN `knowledge_point` VARCHAR(120) NULL AFTER `question_index`',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'lab_recap_question_completions'
    AND column_name = 'knowledge_point'
);
PREPARE stmt FROM @add_knowledge_point;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- selected_option_key：固定单选中所选选项的稳定 key
SET @add_selected_option_key := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `lab_recap_question_completions` ADD COLUMN `selected_option_key` VARCHAR(100) NULL AFTER `knowledge_point`',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'lab_recap_question_completions'
    AND column_name = 'selected_option_key'
);
PREPARE stmt FROM @add_selected_option_key;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- is_correct：本次作答是否正确。NULL 表示既有记录的正确性未知
SET @add_is_correct := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `lab_recap_question_completions` ADD COLUMN `is_correct` BOOLEAN NULL AFTER `selected_option_key`',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'lab_recap_question_completions'
    AND column_name = 'is_correct'
);
PREPARE stmt FROM @add_is_correct;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 掌握度聚合按 (user_id, lab_key, knowledge_point) 跨 trace 归并，
-- 现有索引是 (user_id, lab_key, updated_at)，不服务该查询，故补一条。
SET @add_mastery_index := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `lab_recap_question_completions_user_id_lab_key_knowledge_point_idx` ON `lab_recap_question_completions` (`user_id`, `lab_key`, `knowledge_point`)',
    'DO 0'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'lab_recap_question_completions'
    AND index_name = 'lab_recap_question_completions_user_id_lab_key_knowledge_point_idx'
);
PREPARE stmt FROM @add_mastery_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
