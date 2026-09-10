/**
 * 知识点级复盘题模型（LT-054 设计，LT-055 落地）
 *
 * 口径见 docs/design/knowledge-point-recap-model.md。
 * 本模块只做结构校验，不含任何题库内容（题库属 LT-057／LT-059）。
 */

export const recapMasteryStatuses = ["mastered", "attempted", "untouched"];

export function createRecapQuestionKey(
  labKey,
  knowledgePointIndex,
  questionIndex,
) {
  return `${labKey}::kp${knowledgePointIndex}::q${questionIndex}`;
}

export function findRecapQuestionCorrectOption(question) {
  const correctOptions = (question?.options ?? []).filter(
    (option) => option?.correct === true,
  );

  // 恰好一个才返回。0 个或多个都属结构错误，交由 validateRecapQuestion 报出。
  return correctOptions.length === 1 ? correctOptions[0] : undefined;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRecapQuestionOption(option, index, errors) {
  if (!option || typeof option !== "object") {
    errors.push(`options[${index}] 必须是对象`);
    return;
  }

  if (!isNonEmptyString(option.key)) {
    errors.push(`options[${index}].key 必须是非空字符串`);
  }

  if (!isNonEmptyString(option.text)) {
    errors.push(`options[${index}].text 必须是非空字符串`);
  }

  if (typeof option.correct !== "boolean") {
    errors.push(`options[${index}].correct 必须是布尔值`);
  }
}

/**
 * 提示不得指向答案的两条机械判据（LT-054 决策五）：
 * 不得逐字复述任一选项文案，也不得包含正确选项的 key。
 * 「提示应指向分析方法而非结论」属内容质量约束，无法机械判定，不在此校验。
 */
function validateRecapQuestionHint(question, errors) {
  if (question.hint === undefined) {
    return;
  }

  if (!isNonEmptyString(question.hint)) {
    errors.push("hint 存在时必须是非空字符串");
    return;
  }

  for (const option of question.options) {
    if (
      isNonEmptyString(option?.text) &&
      question.hint.includes(option.text)
    ) {
      errors.push("hint 不得包含任一选项的完整文案");
      break;
    }
  }

  const correctOption = findRecapQuestionCorrectOption(question);

  if (
    correctOption &&
    isNonEmptyString(correctOption.key) &&
    question.hint.includes(correctOption.key)
  ) {
    errors.push("hint 不得包含正确选项的 key");
  }
}

export function validateRecapQuestion(value) {
  const errors = [];

  if (!value || typeof value !== "object") {
    return { ok: false, errors: ["复盘题必须是对象"] };
  }

  const question = value;

  for (const field of ["key", "labKey", "knowledgePoint", "prompt", "explanation"]) {
    if (!isNonEmptyString(question[field])) {
      errors.push(`${field} 必须是非空字符串`);
    }
  }

  if (!Array.isArray(question.options)) {
    errors.push("options 必须是数组");
    return { ok: false, errors };
  }

  // 少于两个选项没有判别力，等同于旧的「点过即完成」
  if (question.options.length < 2) {
    errors.push("options 至少需要 2 个选项");
  }

  question.options.forEach((option, index) => {
    validateRecapQuestionOption(option, index, errors);
  });

  const optionKeys = question.options
    .map((option) => option?.key)
    .filter(isNonEmptyString);

  if (new Set(optionKeys).size !== optionKeys.length) {
    errors.push("options[].key 在同一题内必须唯一");
  }

  const correctCount = question.options.filter(
    (option) => option?.correct === true,
  ).length;

  // 恰好一个正确选项是掌握度可判对错的前提：0 个无法判对，多个需要定义
  // 「部分正确」口径，会让 LT-056 的「答错判未掌握」失去确定性。
  if (correctCount !== 1) {
    errors.push(`options 必须恰好有 1 个正确选项，当前为 ${correctCount} 个`);
  }

  validateRecapQuestionHint(question, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: question };
}
