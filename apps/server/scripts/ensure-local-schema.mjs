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
        \`is_completed\` BOOLEAN NOT NULL DEFAULT true,
        \`completed_at\` DATETIME(0) NULL,
        \`created_at\` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
        \`updated_at\` DATETIME(0) NOT NULL,
        UNIQUE INDEX \`lab_recap_question_completions_user_id_trace_id_question_key_key\` (\`user_id\`, \`trace_id\`, \`question_key\`),
        INDEX \`lab_recap_question_completions_user_id_lab_key_updated_at_idx\` (\`user_id\`, \`lab_key\`, \`updated_at\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`lab_recap_question_completions_user_id_fkey\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log(`created ${tableName}`);
  } else {
    console.log(`${tableName} already exists`);
  }
} finally {
  await prisma.$disconnect();
}
