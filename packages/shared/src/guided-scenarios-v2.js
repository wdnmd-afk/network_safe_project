// 引导式工作台第二版共享模型（LT-005）。
//
// 第一版（guided-scenarios.js）是单步评估：一个 scenarioKey + 一个 controlKey
// 得到一个决策。第二版在不增加真实攻击能力的前提下，引入多固定案例、多步骤
// 状态机、证据/时间线/资产卡、固定分支决策、三类结果（risk/fix/normal）、
// 每步风险信号和统一复盘。
//
// 本文件只提供共享类型（见 .d.ts）、schema 校验器和确定性状态机骨架，
// 不接入运行时后端服务与前端页面。所有数据均为固定虚构内容，状态机仅在
// 已登记的 key 之间转移，未知 key 一律脱敏阻断且不回显原始输入。

const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OUTCOME_VALUES = new Set(["risk", "fix", "normal"]);
const DECISION_VALUES = new Set(["accepted", "blocked"]);
const MODE_VALUES = new Set(["interactive", "simulation", "case-study"]);
const SEVERITY_VALUES = new Set(["low", "medium", "high", "critical"]);
const DIFFICULTY_VALUES = new Set(["beginner", "intermediate", "advanced"]);
const CARD_KINDS = new Set(["asset", "timeline", "evidence", "policy"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isKebab(value) {
  return typeof value === "string" && KEBAB_PATTERN.test(value);
}

function isKebabWithin(value, max) {
  return isKebab(value) && value.length <= max;
}

// ---------------------------------------------------------------------------
// Schema 校验
// ---------------------------------------------------------------------------

function validateScoringDimensions(dimensions, errors) {
  if (!Array.isArray(dimensions)) {
    errors.push("scoringDimensions must be an array");
    return new Set();
  }

  const keys = new Set();

  dimensions.forEach((dimension, index) => {
    if (!isRecord(dimension)) {
      errors.push(`scoringDimensions[${index}] must be an object`);
      return;
    }

    if (!isKebabWithin(dimension.key, 60)) {
      errors.push(`scoringDimensions[${index}].key must be kebab-case`);
    } else if (keys.has(dimension.key)) {
      errors.push(`scoringDimensions[${index}].key duplicates ${dimension.key}`);
    } else {
      keys.add(dimension.key);
    }

    if (!isNonEmptyString(dimension.title)) {
      errors.push(`scoringDimensions[${index}].title must be a non-empty string`);
    }

    if (!isNonEmptyString(dimension.description)) {
      errors.push(
        `scoringDimensions[${index}].description must be a non-empty string`,
      );
    }

    if (typeof dimension.max !== "number" || dimension.max <= 0) {
      errors.push(`scoringDimensions[${index}].max must be a positive number`);
    }
  });

  return keys;
}

function validateOption(option, context, dimensionKeys, stepKeys, errors) {
  const label = `${context}`;

  if (!isRecord(option)) {
    errors.push(`${label} must be an object`);
    return;
  }

  if (!isKebabWithin(option.key, 60)) {
    errors.push(`${label}.key must be kebab-case`);
  }

  if (!isNonEmptyString(option.label)) {
    errors.push(`${label}.label must be a non-empty string`);
  }

  if (!OUTCOME_VALUES.has(option.outcome)) {
    errors.push(`${label}.outcome must be one of risk|fix|normal`);
  }

  if (!DECISION_VALUES.has(option.decision)) {
    errors.push(`${label}.decision must be one of accepted|blocked`);
  }

  if (!isKebabWithin(option.signal, 100)) {
    errors.push(`${label}.signal must be kebab-case`);
  }

  if (!isNonEmptyString(option.explanation)) {
    errors.push(`${label}.explanation must be a non-empty string`);
  }

  if (option.nextStepKey !== null) {
    if (!isNonEmptyString(option.nextStepKey)) {
      errors.push(`${label}.nextStepKey must be a step key or null`);
    } else if (!stepKeys.has(option.nextStepKey)) {
      errors.push(`${label}.nextStepKey references unknown step ${option.nextStepKey}`);
    }
  }

  if (option.scoreDeltas !== undefined) {
    if (!isRecord(option.scoreDeltas)) {
      errors.push(`${label}.scoreDeltas must be an object`);
    } else {
      for (const [dimensionKey, delta] of Object.entries(option.scoreDeltas)) {
        if (!dimensionKeys.has(dimensionKey)) {
          errors.push(`${label}.scoreDeltas references unknown dimension ${dimensionKey}`);
        }

        if (typeof delta !== "number") {
          errors.push(`${label}.scoreDeltas.${dimensionKey} must be a number`);
        }
      }
    }
  }
}

function validateCards(cards, context, errors) {
  if (cards === undefined) {
    return;
  }

  if (!Array.isArray(cards)) {
    errors.push(`${context} must be an array`);
    return;
  }

  cards.forEach((card, index) => {
    if (!isRecord(card)) {
      errors.push(`${context}[${index}] must be an object`);
      return;
    }

    if (!isKebabWithin(card.key, 60)) {
      errors.push(`${context}[${index}].key must be kebab-case`);
    }

    if (!CARD_KINDS.has(card.kind)) {
      errors.push(`${context}[${index}].kind must be asset|timeline|evidence|policy`);
    }

    if (!isNonEmptyString(card.title)) {
      errors.push(`${context}[${index}].title must be a non-empty string`);
    }

    if (!isNonEmptyString(card.detail)) {
      errors.push(`${context}[${index}].detail must be a non-empty string`);
    }
  });
}

// 从 initialStepKey 出发做深度优先遍历，确认：所有 nextStepKey 均可解析、
// 无环、且每条路径都能到达终止步骤（nextStepKey === null）。
function validateReachability(caseDef, context, errors) {
  const stepMap = new Map(caseDef.steps.map((step) => [step.key, step]));

  if (!stepMap.has(caseDef.initialStepKey)) {
    errors.push(`${context}.initialStepKey references unknown step`);
    return;
  }

  const visiting = new Set();
  const settled = new Set();
  let sawTerminal = false;

  function walk(stepKey, path) {
    if (visiting.has(stepKey)) {
      errors.push(`${context} has a cycle through step ${stepKey}`);
      return;
    }

    if (settled.has(stepKey)) {
      return;
    }

    const step = stepMap.get(stepKey);

    if (!step) {
      errors.push(`${context} path ${path} references unknown step ${stepKey}`);
      return;
    }

    visiting.add(stepKey);

    for (const option of step.options) {
      if (option.nextStepKey === null) {
        sawTerminal = true;
        continue;
      }

      if (typeof option.nextStepKey === "string") {
        walk(option.nextStepKey, `${path}>${option.nextStepKey}`);
      }
    }

    visiting.delete(stepKey);
    settled.add(stepKey);
  }

  walk(caseDef.initialStepKey, caseDef.initialStepKey);

  if (!sawTerminal) {
    errors.push(`${context} has no terminal option (nextStepKey null)`);
  }
}

function validateCase(caseDef, context, dimensionKeys, errors) {
  if (!isRecord(caseDef)) {
    errors.push(`${context} must be an object`);
    return;
  }

  if (!isKebabWithin(caseDef.key, 60)) {
    errors.push(`${context}.key must be kebab-case`);
  }

  if (!isNonEmptyString(caseDef.title)) {
    errors.push(`${context}.title must be a non-empty string`);
  }

  if (!isNonEmptyString(caseDef.description)) {
    errors.push(`${context}.description must be a non-empty string`);
  }

  validateCards(caseDef.assets, `${context}.assets`, errors);
  validateCards(caseDef.timeline, `${context}.timeline`, errors);
  validateCards(caseDef.evidence, `${context}.evidence`, errors);

  if (!Array.isArray(caseDef.steps) || caseDef.steps.length === 0) {
    errors.push(`${context}.steps must be a non-empty array`);
    return;
  }

  const stepKeys = new Set();

  caseDef.steps.forEach((step, index) => {
    if (!isRecord(step)) {
      errors.push(`${context}.steps[${index}] must be an object`);
      return;
    }

    if (!isKebabWithin(step.key, 60)) {
      errors.push(`${context}.steps[${index}].key must be kebab-case`);
    } else if (stepKeys.has(step.key)) {
      errors.push(`${context}.steps[${index}].key duplicates ${step.key}`);
    } else {
      stepKeys.add(step.key);
    }

    if (typeof step.order !== "number") {
      errors.push(`${context}.steps[${index}].order must be a number`);
    }

    if (!isNonEmptyString(step.title)) {
      errors.push(`${context}.steps[${index}].title must be a non-empty string`);
    }

    if (!isNonEmptyString(step.prompt)) {
      errors.push(`${context}.steps[${index}].prompt must be a non-empty string`);
    }

    if (!isKebabWithin(step.riskSignal, 100)) {
      errors.push(`${context}.steps[${index}].riskSignal must be kebab-case`);
    }
  });

  caseDef.steps.forEach((step, index) => {
    if (!isRecord(step) || !Array.isArray(step.options) || step.options.length === 0) {
      errors.push(`${context}.steps[${index}].options must be a non-empty array`);
      return;
    }

    const optionKeys = new Set();

    step.options.forEach((option, optionIndex) => {
      validateOption(
        option,
        `${context}.steps[${index}].options[${optionIndex}]`,
        dimensionKeys,
        stepKeys,
        errors,
      );

      if (isRecord(option) && typeof option.key === "string") {
        if (optionKeys.has(option.key)) {
          errors.push(
            `${context}.steps[${index}].options duplicates key ${option.key}`,
          );
        } else {
          optionKeys.add(option.key);
        }
      }
    });
  });

  if (!isNonEmptyString(caseDef.initialStepKey)) {
    errors.push(`${context}.initialStepKey must be a step key`);
  } else if (stepKeys.size > 0) {
    validateReachability(caseDef, context, errors);
  }
}

/**
 * 校验一个第二版引导式场景定义。返回 { ok: true, value } 或 { ok: false, errors }。
 */
export function validateGuidedScenarioV2(definition) {
  const errors = [];

  if (!isRecord(definition)) {
    return { ok: false, errors: ["definition must be an object"] };
  }

  if (definition.version !== 2) {
    errors.push("version must be the number 2");
  }

  for (const field of ["id", "slug", "category", "subcategory", "title", "summary", "phase", "notes"]) {
    if (!isNonEmptyString(definition[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (
    isNonEmptyString(definition.category) &&
    isNonEmptyString(definition.subcategory) &&
    definition.id !== `${definition.category}.${definition.subcategory}`
  ) {
    errors.push("id must equal `${category}.${subcategory}`");
  }

  if (isNonEmptyString(definition.subcategory) && definition.slug !== definition.subcategory) {
    errors.push("slug must equal subcategory");
  }

  if (!MODE_VALUES.has(definition.mode)) {
    errors.push("mode must be interactive|simulation|case-study");
  }

  if (!SEVERITY_VALUES.has(definition.severity)) {
    errors.push("severity must be low|medium|high|critical");
  }

  if (!DIFFICULTY_VALUES.has(definition.difficulty)) {
    errors.push("difficulty must be beginner|intermediate|advanced");
  }

  for (const field of ["tags", "knowledgePoints", "safeBoundaries"]) {
    if (!Array.isArray(definition[field]) || definition[field].length === 0) {
      errors.push(`${field} must be a non-empty array`);
    }
  }

  const dimensionKeys = validateScoringDimensions(
    definition.scoringDimensions,
    errors,
  );

  if (!Array.isArray(definition.cases) || definition.cases.length === 0) {
    errors.push("cases must be a non-empty array");
  } else {
    const caseKeys = new Set();

    definition.cases.forEach((caseDef, index) => {
      validateCase(caseDef, `cases[${index}]`, dimensionKeys, errors);

      if (isRecord(caseDef) && typeof caseDef.key === "string") {
        if (caseKeys.has(caseDef.key)) {
          errors.push(`cases[${index}].key duplicates ${caseDef.key}`);
        } else {
          caseKeys.add(caseDef.key);
        }
      }
    });

    if (!isNonEmptyString(definition.defaultCaseKey)) {
      errors.push("defaultCaseKey must be a case key");
    } else if (!caseKeys.has(definition.defaultCaseKey)) {
      errors.push("defaultCaseKey references unknown case");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: definition };
}

// ---------------------------------------------------------------------------
// 确定性状态机骨架
// ---------------------------------------------------------------------------

function findCase(definition, caseKey) {
  const key = caseKey ?? definition.defaultCaseKey;

  return definition.cases.find((candidate) => candidate.key === key);
}

/**
 * 基于固定定义创建一个确定性状态机。状态机只在已登记的 step 与 option 之间
 * 转移；对未知 option 返回脱敏阻断结果，不改变状态、不回显原始输入。
 */
export function createGuidedScenarioMachine(definition, caseKey) {
  const validation = validateGuidedScenarioV2(definition);

  if (!validation.ok) {
    throw new Error(
      `invalid guided scenario v2 definition: ${validation.errors.join("; ")}`,
    );
  }

  const activeCase = findCase(definition, caseKey);

  if (!activeCase) {
    throw new Error("unknown caseKey for guided scenario v2");
  }

  const stepMap = new Map(activeCase.steps.map((step) => [step.key, step]));
  const dimensionKeys = definition.scoringDimensions.map((d) => d.key);

  function freshScores() {
    const scores = {};

    for (const key of dimensionKeys) {
      scores[key] = 0;
    }

    return scores;
  }

  let currentStepKey = activeCase.initialStepKey;
  let history = [];
  let scores = freshScores();
  let done = false;

  function currentStep() {
    return stepMap.get(currentStepKey) ?? null;
  }

  function availableOptions() {
    const step = currentStep();

    if (!step || done) {
      return [];
    }

    return step.options.map((option) => ({
      key: option.key,
      label: option.label,
      outcome: option.outcome,
    }));
  }

  function choose(optionKey) {
    if (done) {
      return {
        status: "blocked",
        reason: "machine-completed",
        signal: "guided-v2-completed",
        stepKey: currentStepKey,
      };
    }

    const step = currentStep();
    const option = step
      ? step.options.find((candidate) => candidate.key === optionKey)
      : undefined;

    if (!option) {
      // 未登记的 option：脱敏阻断，不写入原始输入、不推进状态。
      return {
        status: "blocked",
        reason: "option-not-allowed",
        signal: "guided-v2-option-blocked",
        stepKey: currentStepKey,
      };
    }

    if (option.scoreDeltas) {
      for (const [dimensionKey, delta] of Object.entries(option.scoreDeltas)) {
        scores[dimensionKey] = (scores[dimensionKey] ?? 0) + delta;
      }
    }

    const record = {
      stepKey: step.key,
      stepRiskSignal: step.riskSignal,
      optionKey: option.key,
      outcome: option.outcome,
      decision: option.decision,
      signal: option.signal,
    };

    history = [...history, record];

    if (option.nextStepKey === null) {
      done = true;
    } else {
      currentStepKey = option.nextStepKey;
    }

    return {
      status: "ok",
      stepKey: record.stepKey,
      outcome: option.outcome,
      decision: option.decision,
      signal: option.signal,
      explanation: option.explanation,
      nextStepKey: option.nextStepKey,
      completed: done,
    };
  }

  function back() {
    if (history.length === 0) {
      return { status: "noop" };
    }

    const previous = history[history.length - 1];
    const step = stepMap.get(previous.stepKey);
    const option = step?.options.find((o) => o.key === previous.optionKey);

    if (option?.scoreDeltas) {
      for (const [dimensionKey, delta] of Object.entries(option.scoreDeltas)) {
        scores[dimensionKey] = (scores[dimensionKey] ?? 0) - delta;
      }
    }

    history = history.slice(0, -1);
    currentStepKey = previous.stepKey;
    done = false;

    return { status: "ok", stepKey: currentStepKey };
  }

  function reset() {
    currentStepKey = activeCase.initialStepKey;
    history = [];
    scores = freshScores();
    done = false;
  }

  function outcomeCounts() {
    const counts = { risk: 0, fix: 0, normal: 0 };

    for (const record of history) {
      counts[record.outcome] += 1;
    }

    return counts;
  }

  // 事件日志安全摘要：只包含固定 key、步骤、决策、信号、结果计数和分数，
  // 不包含任何自由文本、真实目标、凭据或原始未知输入。
  function recap() {
    return {
      caseKey: activeCase.key,
      completed: done,
      currentStepKey: done ? null : currentStepKey,
      path: history.map((record) => ({
        stepKey: record.stepKey,
        optionKey: record.optionKey,
        outcome: record.outcome,
        decision: record.decision,
        signal: record.signal,
      })),
      outcomeCounts: outcomeCounts(),
      scores: { ...scores },
      terminalOutcome: done ? history[history.length - 1]?.outcome ?? null : null,
    };
  }

  return {
    definitionId: definition.id,
    caseKey: activeCase.key,
    get currentStepKey() {
      return done ? null : currentStepKey;
    },
    get isCompleted() {
      return done;
    },
    availableOptions,
    choose,
    back,
    reset,
    recap,
  };
}

// ---------------------------------------------------------------------------
// 第一版兼容适配器
// ---------------------------------------------------------------------------

/**
 * 将第一版单步场景提升为第二版单案例单步状态机，用于证明新模型能够表达
 * 现有全部 38 个引导式场景，而不改变其固定语义。
 */
export function liftV1Scenario(v1Definition) {
  const scenario = v1Definition.scenarios[0];
  const [weakControl, strongControl] = v1Definition.controls;

  const definition = {
    version: 2,
    id: v1Definition.id,
    slug: v1Definition.slug,
    category: v1Definition.category,
    subcategory: v1Definition.subcategory,
    title: v1Definition.title,
    mode: v1Definition.mode,
    severity: v1Definition.severity,
    difficulty: v1Definition.difficulty,
    summary: v1Definition.summary,
    phase: v1Definition.phase,
    tags: v1Definition.tags,
    knowledgePoints: v1Definition.knowledgePoints,
    scoringDimensions: [
      {
        key: "risk-awareness",
        title: "风险识别",
        description: "识别固定案例中的高风险决策。",
        max: 1,
      },
      {
        key: "defense-alignment",
        title: "防御落实",
        description: "选择已落实控制策略并验证正常流程。",
        max: 1,
      },
    ],
    defaultCaseKey: scenario.key,
    cases: [
      {
        key: scenario.key,
        title: scenario.title,
        description: scenario.description,
        evidence: scenario.riskIndicators.map((indicator, index) => ({
          key: `${scenario.key}-indicator-${index + 1}`,
          kind: "evidence",
          title: indicator,
          detail: `固定风险标签：${indicator}。`,
        })),
        initialStepKey: "assess-fixed-case",
        steps: [
          {
            key: "assess-fixed-case",
            order: 1,
            title: "评估固定案例",
            prompt: "选择针对该固定高风险案例的处置方式。",
            riskSignal: `${v1Definition.id.replaceAll(".", "-")}-assessment`,
            options: [
              {
                key: "accept-risk",
                label: "接受高风险动作（漏洞视角）",
                outcome: "risk",
                decision: v1Definition.vulnerableOutcome.decision,
                signal: v1Definition.vulnerableOutcome.signal,
                explanation: v1Definition.vulnerableOutcome.message,
                nextStepKey: null,
                scoreDeltas: { "risk-awareness": 0 },
              },
              {
                key: weakControl.key,
                label: weakControl.title,
                outcome: "fix",
                decision: weakControl.fixedDecision,
                signal: weakControl.fixedSignal,
                explanation: weakControl.fixedMessage,
                nextStepKey: null,
                scoreDeltas: { "risk-awareness": 1 },
              },
              {
                key: strongControl.key,
                label: strongControl.title,
                outcome: "normal",
                decision: strongControl.fixedDecision,
                signal: strongControl.fixedSignal,
                explanation: strongControl.fixedMessage,
                nextStepKey: null,
                scoreDeltas: { "defense-alignment": 1 },
              },
            ],
          },
        ],
      },
    ],
    safeBoundaries: v1Definition.safeBoundaries,
    notes: v1Definition.notes,
  };

  return definition;
}
