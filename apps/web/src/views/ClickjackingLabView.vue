<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchClickjackingWorkbench,
  submitClickjackingEvaluation,
  type ClickjackingResult,
  type ClickjackingStep,
  type ClickjackingWorkbench,
} from "../api/clickjacking-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  clickjackingNormalPath,
  clickjackingScenarioKey,
  createClickjackingLearningProgress,
  createClickjackingVerificationRecord,
  clickjackingReviewChecklist,
  formatClickjackingSignal,
  getClickjackingVariantConfig,
  type ClickjackingVariantKey,
} from "../labs/clickjacking";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: ClickjackingVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getClickjackingVariantConfig(props.variant));

const workbench = ref<ClickjackingWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<ClickjackingResult | null>(null);
const isLoadingConfig = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<ClickjackingStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((a, b) => a.order - b.order)
    : [],
);
const signalText = computed(() =>
  result.value ? formatClickjackingSignal(result.value.signal) : "尚未运行固定评估",
);

const evidenceCards = computed(() => activeCase.value?.evidence ?? []);

// 当前决策路径覆盖到哪个步骤：按步骤顺序，每一步展示可选固定选项。
function optionSelectedAt(stepIndex: number) {
  return decisions.value[stepIndex] ?? "";
}

function chooseOption(stepIndex: number, optionKey: string) {
  // 只保留到当前步骤为止的决策，后续步骤重新选择，保证路径确定性。
  decisions.value = [...decisions.value.slice(0, stepIndex), optionKey];
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";
}

function applyRecommendedPath() {
  decisions.value = [...config.value.recommendedPath];
  result.value = null;
  actionMessage.value = "已载入推荐固定决策路径";
  errorMessage.value = "";
}

function applyNormalFlowPath() {
  decisions.value = [...clickjackingNormalPath];
  result.value = null;
  actionMessage.value = "已载入修复后正常确认流程路径";
  errorMessage.value = "";
}

const summaryRows = computed(() => {
  if (!result.value) {
    return [
      { label: "案例来源", value: "专用固定决策状态机" },
      { label: "输入方式", value: "固定 scenarioKey / 决策选项" },
      { label: "事件日志", value: "只记录安全摘要" },
      { label: "外部连接", value: "禁止" },
    ];
  }

  return [
    { label: "风险等级", value: result.value.assessment.riskLevel },
    { label: "决策步数", value: String(result.value.assessment.stepCount) },
    { label: "风险结果数", value: String(result.value.recap.outcomeCounts.risk) },
    { label: "防御结果数", value: String(result.value.recap.outcomeCounts.fix) },
    { label: "正常结果数", value: String(result.value.recap.outcomeCounts.normal) },
    {
      label: "终止结果",
      value: result.value.recap.terminalOutcome ?? "none",
    },
    { label: "固定案例", value: result.value.scenarioKey },
  ];
});

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "web",
      "clickjacking",
      session.token,
      createClickjackingLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定场景观察。
  }
}

async function recordVerification(resultValue: ClickjackingResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "clickjacking",
      session.token,
      createClickjackingVerificationRecord(config.value, resultValue),
    );
  } catch {
    // 验证记录失败时仍保留服务端评估和事件日志结果。
  }
}

async function loadWorkbench() {
  isLoadingConfig.value = true;
  workbench.value = null;
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await fetchClickjackingWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定场景工作台加载失败";
  } finally {
    isLoadingConfig.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定场景评估";
    return;
  }

  if (decisions.value.length < orderedSteps.value.length) {
    errorMessage.value = "请为每个步骤选择固定决策";
    return;
  }

  isSubmitting.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitClickjackingEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: clickjackingScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定场景评估失败";
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.variant,
  () => {
    void loadWorkbench();
  },
  { immediate: true },
);
</script>

<template>
  <section class="page-section two-column clickjacking-page">
    <div class="section-heading">
      <p class="eyebrow">web / clickjacking</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/clickjacking/vuln">风险观察版</RouterLink>
        <RouterLink to="/labs/web/clickjacking/fixed">防御复盘版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink class="text-link" to="/labs/web/clickjacking"
        >返回实验详情</RouterLink
      >
    </div>

    <div class="clickjacking-workbench">
      <p v-if="isLoadingConfig" class="state-text">正在加载固定场景...</p>

      <template v-else-if="workbench && activeCase">
        <form class="form-panel" @submit.prevent="submitEvaluation">
          <p class="form-hint">{{ config.panelIntro }}</p>

          <fieldset
            v-for="(step, stepIndex) in orderedSteps"
            :key="step.key"
            class="decision-step"
          >
            <legend>{{ step.order }}. {{ step.title }}</legend>
            <p class="form-hint">{{ step.prompt }}</p>
            <div class="decision-options">
              <button
                v-for="option in step.options"
                :key="option.key"
                type="button"
                class="secondary-button"
                :class="{
                  'option-active': optionSelectedAt(stepIndex) === option.key,
                }"
                :aria-pressed="optionSelectedAt(stepIndex) === option.key"
                @click="chooseOption(stepIndex, option.key)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <div class="form-actions">
            <button
              type="button"
              class="secondary-button"
              @click="applyRecommendedPath"
            >
              载入推荐路径
            </button>
            <button
              v-if="config.key === 'fixed'"
              type="button"
              class="secondary-button"
              @click="applyNormalFlowPath"
            >
              正常确认流程
            </button>
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? "评估中..." : "运行固定评估" }}
            </button>
          </div>
        </form>

        <section
          class="clickjacking-status-panel"
          aria-label="固定场景评估状态"
          aria-live="polite"
        >
          <div class="status-metric">
            <span>后端决策</span>
            <strong>{{ result?.decision ?? "pending" }}</strong>
          </div>
          <div class="status-metric">
            <span>学习信号</span>
            <strong>{{ signalText }}</strong>
          </div>
          <div class="status-metric">
            <span>当前案例</span>
            <strong>{{ activeCase.title }}</strong>
          </div>

          <dl class="inspection-grid">
            <div v-for="row in summaryRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>

          <ol v-if="result" class="record-list">
            <li v-for="step in result.steps" :key="step.stepKey">
              <strong>{{ formatClickjackingSignal(step.signal) }}</strong>
              <span>{{ step.decision }} / {{ step.outcome }}</span>
              <small>{{ step.explanation }}</small>
            </li>
          </ol>

          <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
          <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
          <p v-if="!session.token" class="state-text">
            登录后可运行固定评估，并将安全摘要写入实验事件日志。
          </p>
        </section>

        <section class="form-panel" aria-label="固定证据线索">
          <h2>固定证据线索</h2>
          <ul class="record-list">
            <li v-for="card in evidenceCards" :key="card.key">
              <strong>{{ card.title }}</strong>
              <span>{{ card.detail }}</span>
            </li>
          </ul>
        </section>

        <section class="form-panel" aria-label="点击劫持复盘清单">
          <h2>复盘清单</h2>
          <ul class="record-list">
            <li v-for="item in clickjackingReviewChecklist" :key="item.key">
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
            </li>
          </ul>
        </section>

        <section class="guided-boundaries" aria-label="实验安全边界">
          <h2>安全边界</h2>
          <ul>
            <li v-for="boundary in workbench.safeBoundaries" :key="boundary">
              {{ boundary }}
            </li>
          </ul>
        </section>
      </template>

      <p v-if="errorMessage && !workbench" class="error-text">
        {{ errorMessage }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.clickjacking-page {
  align-items: start;
}

.decision-step {
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 0.6rem;
  padding: 0.85rem 1rem;
  margin: 0 0 0.9rem;
  display: grid;
  gap: 0.6rem;
}

.decision-step legend {
  font-weight: 700;
  padding: 0 0.4rem;
}

.decision-options {
  display: grid;
  gap: 0.5rem;
}

.option-active {
  border-color: #67e8f9;
  color: #67e8f9;
  font-weight: 700;
}

.guided-boundaries {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
  padding-top: 0.9rem;
}

.guided-boundaries h2,
.guided-boundaries ul {
  margin: 0;
}

.guided-boundaries ul {
  display: grid;
  gap: 0.6rem;
  padding-left: 1.2rem;
}

.guided-boundaries li {
  color: #cbd5e1;
  line-height: 1.65;
}

.text-link {
  color: #67e8f9;
  font-weight: 700;
}
</style>
