/**
 * 知识点级复盘题模型（LT-054 设计，LT-055 落地）
 *
 * 与旧的纯字符串复盘题的关键区别：题目带固定选项与恰好一个正确答案，
 * 并绑定该实验 meta.json knowledgePoints[] 中的知识点原文，因此作答可判对错、
 * 掌握度可按知识点聚合。
 *
 * 口径见 docs/design/knowledge-point-recap-model.md。
 */

export type RecapMasteryStatus = "mastered" | "attempted" | "untouched";

export type RecapQuestionOption = {
  key: string;
  text: string;
  correct: boolean;
};

export type RecapQuestion = {
  // 题目稳定标识：`<labKey>::kp<知识点下标>::q<题内序号>`，不含 traceId，
  // 使同一道题在任意运行中 key 相同，这是跨 trace 聚合掌握度的前提。
  key: string;
  labKey: string;
  // 必须与该实验 meta.json knowledgePoints[] 中某一元素完全相等。
  knowledgePoint: string;
  prompt: string;
  options: RecapQuestionOption[];
  // 只说明为何危险、为何修复有效，不含可迁移的危险载荷。
  explanation: string;
  // 可选；不得包含任一选项完整文案或正确选项 key。
  hint?: string;
};

export type RecapQuestionValidationResult =
  | {
      ok: true;
      value: RecapQuestion;
    }
  | {
      ok: false;
      errors: string[];
    };

export const recapMasteryStatuses: RecapMasteryStatus[];

/** 题目稳定标识构造：`<labKey>::kp<knowledgePointIndex>::q<questionIndex>` */
export function createRecapQuestionKey(
  labKey: string,
  knowledgePointIndex: number,
  questionIndex: number,
): string;

/** 返回唯一正确选项；正确选项不是恰好一个时返回 undefined */
export function findRecapQuestionCorrectOption(
  question: RecapQuestion,
): RecapQuestionOption | undefined;

/**
 * 结构校验。校验项与 LT-060 门禁一致：恰好一个正确选项、选项数不少于 2、
 * 选项 key 同题内唯一、提示不得指向答案。不校验知识点是否存在于 meta.json
 * （需读取实验元数据，由 LT-060 门禁承担）。
 */
export function validateRecapQuestion(
  value: unknown,
): RecapQuestionValidationResult;
