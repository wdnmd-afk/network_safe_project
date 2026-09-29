import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tableName = "lab_recap_question_completions";

try {
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*) AS table_count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ${tableName}
  `;
  const tableCount = Number(rows[0]?.table_count ?? 0);

  if (tableCount === 0) {
    // 只补齐缺失的平台复盘表，避免 db push 删除按场景维护的实验表。
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`lab_recap_question_completions\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT UNSIGNED NOT NULL,
        \`trace_id\` VARCHAR(64) NOT NULL,
        \`lab_key\` VARCHAR(128) NOT NULL,
        \`question_key\` VARCHAR(100) NOT NULL,
        \`question_index\` INTEGER NOT NULL,
        \`knowledge_point\` VARCHAR(120) NULL,
        \`selected_option_key\` VARCHAR(100) NULL,
        \`is_correct\` BOOLEAN NULL,
        \`is_completed\` BOOLEAN NOT NULL DEFAULT true,
        \`completed_at\` DATETIME(0) NULL,
        \`created_at\` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
        \`updated_at\` DATETIME(0) NOT NULL,
        UNIQUE INDEX \`lab_recap_question_completions_user_id_trace_id_question_key_key\` (\`user_id\`, \`trace_id\`, \`question_key\`),
        INDEX \`lab_recap_question_completions_user_id_lab_key_updated_at_idx\` (\`user_id\`, \`lab_key\`, \`updated_at\`),
        INDEX \`recap_completions_user_lab_knowledge_point_idx\` (\`user_id\`, \`lab_key\`, \`knowledge_point\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`lab_recap_question_completions_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log(`created ${tableName}`);
  } else {
    console.log(`${tableName} already exists`);

    // LT-055：表已存在时补齐知识点级作答三列。
    // 原实现只判「表是否存在」，因此旧本机库即使缺列也会被报为 already exists，
    // 掌握度写入会在运行期报 Unknown column。此处逐列判存后补齐。
    // 列名与 DDL 全部为固定字面量，不拼接任何外部输入。
    const recapAnswerColumns = [
      ["knowledge_point", "VARCHAR(120) NULL"],
      ["selected_option_key", "VARCHAR(100) NULL"],
      ["is_correct", "BOOLEAN NULL"],
    ];

    for (const [columnName, columnDefinition] of recapAnswerColumns) {
      const columnRows = await prisma.$queryRaw`
        SELECT COUNT(*) AS column_count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ${tableName}
          AND column_name = ${columnName}
      `;

      if (Number(columnRows[0]?.column_count ?? 0) === 0) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`,
        );
        console.log(`added ${tableName}.${columnName}`);
      }
    }

    // 掌握度聚合索引同样按需补齐
    const masteryIndexName =
      "recap_completions_user_lab_knowledge_point_idx";
    const indexRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS index_count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ${tableName}
        AND index_name = ${masteryIndexName}
    `;

    if (Number(indexRows[0]?.index_count ?? 0) === 0) {
      await prisma.$executeRawUnsafe(
        `CREATE INDEX \`${masteryIndexName}\` ON \`${tableName}\` (\`user_id\`, \`lab_key\`, \`knowledge_point\`)`,
      );
      console.log(`added index ${masteryIndexName}`);
    }
  }
} finally {
  await prisma.$disconnect();
}
