<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitPromptInjectionObservation,
  type PromptInjectionDefensePolicyKey,
  type PromptInjectionInstructionSourceKey,
  type PromptInjectionResult,
  type PromptInjectionScenarioKey,
} from "../api/prompt-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createPromptInjectionLearningProgress,
  createPromptInjectionVerificationRecord,
  defaultPromptInjectionInstructionSourceKey,
  defaultPromptInjectionScenarioKey,
  formatPromptInjectionSignal,
  getDefaultPromptInjectionDefensePolicyKey,
  getPromptInjectionScenarioObservationRows,
  getPromptInjectionVariantConfig,
  promptInjectionDefensePolicyOptions,
  promptInjectionInstructionSourceOptions,
  promptInjectionReviewChecklist,
  promptInjectionScenarioOptions,
  type PromptInjectionVariantKey,
} from "../labs/prompt-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PromptInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPromptInjectionVariantConfig(props.variant));
const scenarioRows = computed(() =>
  getPromptInjectionScenarioObservationRows(config.value.key),
);
const scenarioKey = ref<PromptInjectionScenarioKey>(
  defaultPromptInjectionScenarioKey,
);
const instructionSourceKey = ref<PromptInjectionInstructionSourceKey>(
  defaultPromptInjectionInstructionSourceKey,
);
const defensePolicyKey = ref<PromptInjectionDefensePolicyKey>(
  getDefaultPromptInjectionDefensePolicyKey(props.variant),
);
const result = ref<PromptInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatPromptInjectionSignal(result.value.signal)
    : "尚未观察固定样例",
);

const selectedScenario = computed(() =>
  promptInjectionScenarioOptions.find(
    (scenario) => scenario.key === scenarioKey.value,
  ),
);

const selectedSource = computed(() =>
  promptInjectionInstructionSourceOptions.find(
    (source) => source.key === instructionSourceKey.value,
  ),
);

const selectedPolicy = computed(() =>
  promptInjectionDefensePolicyOptions.find(
    (policy) => policy.key === defensePolicyKey.value,
  ),
);

const routingRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "风险类别",
      value: result.value.routing.riskCategory,
    },
    {
      label: "固定样例命中",
      value: result.value.routing.matchedControlledSample ? "是" : "否",
    },
    {
      label: "指令优先级",
      value: result.value.routing.instructionPriority,
    },
    {
      label: "工具请求状态",
      value: result.value.routing.toolRequestStatus,
    },
    {
      label: "输出策略状态",
      value: result.value.routing.outputPolicyStatus,
    },
    {
      label: "输入摘要长度",
      value: String(result.value.routing.inputLength),
    },
  ];
});

const policyAuditRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "指令分层",
      value: result.value.policyAudit.layeredInstructions ? "是" : "否",
    },
    {
      label: "检索隔离",
      value: result.value.policyAudit.retrievalIsolated ? "是" : "否",
    },
    {
      label: "工具允许列表",
      value: result.value.policyAudit.toolAllowlisted ? "是" : "否",
    },
    {
      label: "输出策略",
      value: result.value.policyAudit.outputPolicyApplied ? "是" : "否",
    },
    {
      label: "策略阻断",
      value: result.value.policyAudit.blockedByPolicy ? "是" : "否",
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "场景来源",
    value: "固定样例选择器",
  },
  {
    label: "外部内容",
    value: "固定摘要标签",
  },
  {
    label: "后端接口",
    value: "已接入确定性路由 API",
  },
  {
    label: "脚本入口",
    value: "当前不提供",
  },
]);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "ai",
      "prompt-injection",
      session.token,
      createPromptInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(evaluateResult: PromptInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (evaluateResult.signal === "prompt-injection-instruction-overridden" ||
      evaluateResult.signal ===
        "prompt-injection-retrieval-poisoning-visible" ||
      evaluateResult.signal === "prompt-injection-tool-request-exposed" ||
      evaluateResult.signal === "prompt-injection-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (evaluateResult.signal === "prompt-injection-tool-request-blocked" ||
      evaluateResult.signal ===
        "prompt-injection-policy-guardrail-applied" ||
      evaluateResult.signal === "prompt-injection-safe-answer-returned");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "ai",
      "prompt-injection",
      session.token,
      createPromptInjectionVerificationRecord(config.value, evaluateResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function resetResult(message: string) {
  result.value = null;
  actionMessage.value = message;
  errorMessage.value = "";
}

function chooseSupportKb() {
  scenarioKey.value = "support-kb";
  instructionSourceKey.value = "retrieved-note";
  defensePolicyKey.value = getDefaultPromptInjectionDefensePolicyKey(
    config.value.key,
  );
  resetResult("已选择客服知识库固定样例");
}

function chooseToolRequest() {
  scenarioKey.value = "tool-assistant";
  instructionSourceKey.value = "tool-request-note";
  defensePolicyKey.value =
    config.value.key === "fixed" ? "tool-allowlist" : "none";
  resetResult("已选择内部操作助手固定样例");
}

function chooseDocumentQa() {
  scenarioKey.value = "document-qa";
  instructionSourceKey.value = "user-followup";
  defensePolicyKey.value =
    config.value.key === "fixed" ? "layered-instructions" : "none";
  resetResult("已选择文档问答固定样例");
}

function chooseRetrievalIsolation() {
  defensePolicyKey.value = "retrieval-isolation";
  resetResult("已切换到检索隔离策略");
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 Prompt 注入固定样例观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitPromptInjectionObservation(
      config.value.key,
      session.token,
      {
        scenarioKey: scenarioKey.value,
        instructionSourceKey: instructionSourceKey.value,
        defensePolicyKey: defensePolicyKey.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Prompt 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    scenarioKey.value = defaultPromptInjectionScenarioKey;
    instructionSourceKey.value = defaultPromptInjectionInstructionSourceKey;
    defensePolicyKey.value = getDefaultPromptInjectionDefensePolicyKey(
      config.value.key,
    );
    result.value = null;
    actionMessage.value = "";
    errorMessage.value = "";
    void recordProgress();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <section class="page-section two-column">
    <div class="section-heading">
      <p class="eyebrow">ai / prompt injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/ai/prompt-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/ai/prompt-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="prompt-injection-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定场景样例</span>
          <select v-model="scenarioKey" aria-label="Prompt 注入固定场景样例">
            <option
              v-for="scenario in promptInjectionScenarioOptions"
              :key="scenario.key"
              :value="scenario.key"
            >
              {{ scenario.title }}
            </option>
          </select>
        </label>
        <label>
          <span>外部内容来源</span>
          <select
            v-model="instructionSourceKey"
            aria-label="Prompt 注入外部内容来源"
          >
            <option
              v-for="source in promptInjectionInstructionSourceOptions"
              :key="source.key"
              :value="source.key"
            >
              {{ source.title }}
            </option>
          </select>
        </label>
        <label>
          <span>防御策略</span>
          <select v-model="defensePolicyKey" aria-label="Prompt 注入防御策略">
            <option
              v-for="policy in promptInjectionDefensePolicyOptions"
              :key="policy.key"
              :value="policy.key"
            >
              {{ policy.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="chooseSupportKb">
            客服知识库
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseToolRequest"
          >
            工具请求
          </button>
          <button type="button" class="secondary-button" @click="chooseDocumentQa">
            文档问答
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseRetrievalIsolation"
          >
            检索隔离
          </button>
          <button type="submit" :disabled="isLoading">观察路由结果</button>
        </div>
      </form>

      <section
        class="prompt-injection-status-panel"
        aria-label="Prompt 注入实验状态"
      >
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>当前场景</span>
          <strong>{{ result?.scenario?.title ?? selectedScenario?.title }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in routingRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <dl v-else class="inspection-grid">
          <div v-for="row in statusRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in policyAuditRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result" class="document-preview">
          <span
            :class="
              result.policyAudit.blockedByPolicy ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.status }}
          </span>
          <h2>{{ result.scenario?.title ?? "固定样例已阻断" }}</h2>
          <p>{{ result.safeAnswer }}</p>
          <p>{{ result.policyAudit.learningHint }}</p>
        </article>

        <p v-if="!result && selectedScenario" class="state-text">
          {{ selectedScenario.businessGoal }} · {{ selectedScenario.description }}
        </p>
        <p v-if="!result && selectedSource" class="state-text">
          {{ selectedSource.description }}
        </p>
        <p v-if="!result && selectedPolicy" class="state-text">
          {{ selectedPolicy.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 Prompt 注入固定样例观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="Prompt 注入固定样例观察">
        <h2>固定样例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="scenario in scenarioRows" :key="scenario.key">
            <strong>{{ scenario.title }}</strong>
            <span>{{ scenario.businessGoal }}</span>
            <small>{{ scenario.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="Prompt 注入复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in promptInjectionReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
