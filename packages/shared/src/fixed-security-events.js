// 检测响应实验共享的固定脱敏教学数据。该模块不采集真实日志，也不执行规则
// 表达式；规则画像只登记预期命中的固定 eventId，并通过集合比较计算教学指标。

const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RELATIVE_TIMESTAMP_PATTERN = /^T\+\d{2}:\d{2}$/;
const SOURCES = new Set([
  "virtual-auth-service",
  "virtual-endpoint",
  "virtual-network-sensor",
]);
const CATEGORIES = new Set(["auth", "process", "network", "file"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const DISPOSITIONS = new Set(["benign", "suspicious"]);
const DATASET_FIELDS = new Set([
  "key",
  "title",
  "description",
  "events",
  "ruleProfiles",
]);
const EVENT_FIELDS = new Set([
  "eventId",
  "timestamp",
  "source",
  "category",
  "severity",
  "signalTags",
  "summary",
  "expectedDisposition",
]);
const RULE_PROFILE_FIELDS = new Set([
  "key",
  "title",
  "description",
  "matchedEventIds",
]);

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze);
  } else if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
  }

  return Object.freeze(value);
}

export const fixedSecurityEventDataset = deepFreeze({
  key: "fixed-auth-process-alert-timeline",
  title: "固定认证、进程与网络告警时间线",
  description:
    "六条脱敏虚构事件用于观察单信号规则与跨来源关联规则的误报、漏报和研判差异。",
  events: [
    {
      eventId: "auth-failure-burst",
      timestamp: "T+00:00",
      source: "virtual-auth-service",
      category: "auth",
      severity: "medium",
      signalTags: ["repeated-auth-failure", "short-window"],
      summary: "虚构账号在固定短窗口内出现多次失败认证。",
      expectedDisposition: "suspicious",
    },
    {
      eventId: "auth-success-new-context",
      timestamp: "T+00:02",
      source: "virtual-auth-service",
      category: "auth",
      severity: "high",
      signalTags: ["new-context-login", "failure-to-success"],
      summary: "失败认证后出现来自新虚拟上下文的成功登录。",
      expectedDisposition: "suspicious",
    },
    {
      eventId: "unsigned-script-start",
      timestamp: "T+00:04",
      source: "virtual-endpoint",
      category: "process",
      severity: "high",
      signalTags: ["unsigned-script", "unexpected-parent"],
      summary: "虚拟终端记录到未签名教学脚本由异常父进程启动。",
      expectedDisposition: "suspicious",
    },
    {
      eventId: "unusual-egress-burst",
      timestamp: "T+00:06",
      source: "virtual-network-sensor",
      category: "network",
      severity: "high",
      signalTags: ["unusual-egress", "post-login-activity"],
      summary: "虚拟网络传感器记录到登录后的异常出口流量摘要。",
      expectedDisposition: "suspicious",
    },
    {
      eventId: "signed-maintenance-task",
      timestamp: "T+00:08",
      source: "virtual-endpoint",
      category: "process",
      severity: "low",
      signalTags: ["signed-maintenance", "approved-window"],
      summary: "已登记维护窗口内运行签名运维任务。",
      expectedDisposition: "benign",
    },
    {
      eventId: "single-user-auth-retry",
      timestamp: "T+00:10",
      source: "virtual-auth-service",
      category: "auth",
      severity: "low",
      signalTags: ["single-auth-failure", "known-context"],
      summary: "已知虚拟上下文中出现一次用户认证重试。",
      expectedDisposition: "benign",
    },
  ],
  ruleProfiles: [
    {
      key: "broad-auth-failure-rule",
      title: "过宽认证失败规则",
      description: "把所有固定认证失败事件都视为告警，产生一条误报并遗漏跨源证据。",
      matchedEventIds: ["auth-failure-burst", "single-user-auth-retry"],
    },
    {
      key: "narrow-unsigned-process-rule",
      title: "过窄未签名进程规则",
      description: "只观察固定未签名进程事件，遗漏认证与网络侧可疑证据。",
      matchedEventIds: ["unsigned-script-start"],
    },
    {
      key: "correlated-auth-process-network-rule",
      title: "跨来源关联规则",
      description: "关联固定认证、进程与网络证据，同时排除已知维护和单次重试事件。",
      matchedEventIds: [
        "auth-failure-burst",
        "auth-success-new-context",
        "unsigned-script-start",
        "unusual-egress-burst",
      ],
    },
  ],
});

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isKebab(value) {
  return typeof value === "string" && KEBAB_PATTERN.test(value);
}

function hasOnlyFields(value, allowedFields) {
  return Object.keys(value).every((field) => allowedFields.has(field));
}

export function validateFixedSecurityEventDataset(value) {
  const errors = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["dataset must be an object"] };
  }

  if (!hasOnlyFields(value, DATASET_FIELDS)) {
    errors.push("dataset contains unknown fields");
  }

  if (!isKebab(value.key)) {
    errors.push("key must be kebab-case");
  }

  for (const field of ["title", "description"]) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  const eventIds = new Set();

  if (!Array.isArray(value.events) || value.events.length === 0) {
    errors.push("events must be a non-empty array");
  } else {
    value.events.forEach((event, index) => {
      const label = `events[${index}]`;

      if (!isRecord(event)) {
        errors.push(`${label} must be an object`);
        return;
      }

      if (!hasOnlyFields(event, EVENT_FIELDS)) {
        errors.push(`${label} contains unknown fields`);
      }

      if (!isKebab(event.eventId)) {
        errors.push(`${label}.eventId must be kebab-case`);
      } else if (eventIds.has(event.eventId)) {
        errors.push(`${label}.eventId duplicates ${event.eventId}`);
      } else {
        eventIds.add(event.eventId);
      }

      if (
        typeof event.timestamp !== "string" ||
        !RELATIVE_TIMESTAMP_PATTERN.test(event.timestamp)
      ) {
        errors.push(`${label}.timestamp must use T+MM:SS`);
      }

      if (!SOURCES.has(event.source)) {
        errors.push(`${label}.source is not allowed`);
      }

      if (!CATEGORIES.has(event.category)) {
        errors.push(`${label}.category is not allowed`);
      }

      if (!SEVERITIES.has(event.severity)) {
        errors.push(`${label}.severity is not allowed`);
      }

      if (!DISPOSITIONS.has(event.expectedDisposition)) {
        errors.push(`${label}.expectedDisposition is not allowed`);
      }

      if (!isNonEmptyString(event.summary)) {
        errors.push(`${label}.summary must be a non-empty string`);
      }

      if (
        !Array.isArray(event.signalTags) ||
        event.signalTags.length === 0 ||
        event.signalTags.some((tag) => !isKebab(tag))
      ) {
        errors.push(`${label}.signalTags must contain kebab-case values`);
      }
    });
  }

  const ruleKeys = new Set();

  if (!Array.isArray(value.ruleProfiles) || value.ruleProfiles.length === 0) {
    errors.push("ruleProfiles must be a non-empty array");
  } else {
    value.ruleProfiles.forEach((profile, index) => {
      const label = `ruleProfiles[${index}]`;

      if (!isRecord(profile)) {
        errors.push(`${label} must be an object`);
        return;
      }

      if (!hasOnlyFields(profile, RULE_PROFILE_FIELDS)) {
        errors.push(`${label} contains unknown fields`);
      }

      if (!isKebab(profile.key)) {
        errors.push(`${label}.key must be kebab-case`);
      } else if (ruleKeys.has(profile.key)) {
        errors.push(`${label}.key duplicates ${profile.key}`);
      } else {
        ruleKeys.add(profile.key);
      }

      if (!isNonEmptyString(profile.title) || !isNonEmptyString(profile.description)) {
        errors.push(`${label} title and description are required`);
      }

      if (
        !Array.isArray(profile.matchedEventIds) ||
        profile.matchedEventIds.length === 0
      ) {
        errors.push(`${label}.matchedEventIds must be a non-empty array`);
        return;
      }

      if (new Set(profile.matchedEventIds).size !== profile.matchedEventIds.length) {
        errors.push(`${label}.matchedEventIds must be unique`);
      }

      for (const eventId of profile.matchedEventIds) {
        if (!eventIds.has(eventId)) {
          errors.push(`${label}.matchedEventIds references unknown event`);
        }
      }
    });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

function toPercent(part, total) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function analyzeFixedDetectionRule(dataset, ruleProfileKey) {
  const validation = validateFixedSecurityEventDataset(dataset);

  if (!validation.ok) {
    throw new Error(`invalid fixed security event dataset: ${validation.errors.join("; ")}`);
  }

  const profile = dataset.ruleProfiles.find(
    (candidate) => candidate.key === ruleProfileKey,
  );

  if (!profile) {
    return null;
  }

  const matchedIds = new Set(profile.matchedEventIds);
  let truePositiveCount = 0;
  let falsePositiveCount = 0;
  let falseNegativeCount = 0;
  let trueNegativeCount = 0;

  for (const event of dataset.events) {
    const matched = matchedIds.has(event.eventId);
    const suspicious = event.expectedDisposition === "suspicious";

    if (matched && suspicious) {
      truePositiveCount += 1;
    } else if (matched) {
      falsePositiveCount += 1;
    } else if (suspicious) {
      falseNegativeCount += 1;
    } else {
      trueNegativeCount += 1;
    }
  }

  return {
    datasetKey: dataset.key,
    ruleProfileKey: profile.key,
    matchedEventIds: [...profile.matchedEventIds],
    truePositiveCount,
    falsePositiveCount,
    falseNegativeCount,
    trueNegativeCount,
    precisionPercent: toPercent(
      truePositiveCount,
      truePositiveCount + falsePositiveCount,
    ),
    recallPercent: toPercent(
      truePositiveCount,
      truePositiveCount + falseNegativeCount,
    ),
  };
}
