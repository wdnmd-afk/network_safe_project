<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchWorkflowBypassWorkbench,
  submitWorkflowBypassEvaluation,
  type WorkflowBypassResult,
  type WorkflowBypassStep,
  type WorkflowBypassWorkbench,
} from "../api/workflow-bypass-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createWorkflowBypassLearningProgress,
  createWorkflowBypassVerificationRecord,
  formatWorkflowBypassSignal,
  getWorkflowBypassVariantConfig,
  workflowBypassNormalPath,
  workflowBypassReviewChecklist,
  workflowBypassScenarioKey,
  type WorkflowBypassVariantKey,
} from "../labs/workflow-bypass";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: WorkflowBypassVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getWorkflowBypassVariantConfig(props.variant));

const workbench = ref<WorkflowBypassWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<WorkflowBypassResult | null>(null);
const isLoadingConfig = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<WorkflowBypassStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((left, right) => left.order - right.order)
    : [],
);
const signalText = computed(() =>
  result.value
    ? formatWorkflowBypassSignal(result.value.signal)
    : "尚未运行固定评估",
);
const evidenceCards = computed(() => activeCase.value?.evidence ?? []);
const assetCards = computed(() => activeCase.value?.assets ?? []);
const contextCards = computed(() => [
  ...assetCards.value,
  ...evidenceCards.value,
]);

function optionSelectedAt(stepIndex: number) {
  return decisions.value[stepIndex] ?? "";
}

function chooseOption(stepIndex: number, optionKey: string) {
  // 修改前序决策时丢弃后续选择，确保提交路径与页面显示顺序一致。
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
  decisions.value = [...workflowBypassNormalPath];
  result.value = null;
  actionMessage.value = "已载入修复后正常订单流程路径";
  errorMessage.value = "";
}

const summaryRows = computed(() => {
  if (!result.value) {
    return [
      { label: "固定顺序", value: "pending -> paid -> shipping" },
      { label: "输入方式", value: "固定 scenarioKey / 决策选项" },
      { label: "事件日志", value: "只记录安全摘要" },
      { label: "真实业务调用", value: "禁止" },
    ];
  }

  return [
    { label: "风险等级", value: result.value.assessment.riskLevel },
    { label: "决策步数", value: String(result.value.assessment.stepCount) },
    { label: "风险结果数", value: String(result.value.recap.outcomeCounts.risk) },
    { label: "防御结果数", value: String(result.value.recap.outcomeCounts.fix) },
    {
      label: "正常结果数",
      value: String(result.value.recap.outcomeCounts.normal),
    },
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
      "business-logic",
      "workflow-bypass",
      session.token,
      createWorkflowBypassLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定场景观察。
  }
}

async function recordVerification(resultValue: WorkflowBypassResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "business-logic",
      "workflow-bypass",
      session.token,
      createWorkflowBypassVerificationRecord(config.value, resultValue),
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
    const response = await fetchWorkflowBypassWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定流程工作台加载失败";
  } finally {
    isLoadingConfig.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定流程评估";
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
    const response = await submitWorkflowBypassEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: workflowBypassScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定流程评估失败";
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
  <section class="page-section two-column workflow-bypass-page">
    <div class="section-heading">
      <p class="eyebrow">business logic / workflow bypass</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/business-logic/workflow-bypass/vuln"
          >风险观察版</RouterLink
        >
        <RouterLink to="/labs/business-logic/workflow-bypass/fixed"
          >防御复盘版</RouterLink
        >
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink class="text-link" to="/labs/business-logic/workflow-bypass"
        >返回实验详情</RouterLink
      >
    </div>

    <div class="workflow-bypass-workbench">
      <p v-if="isLoadingConfig" class="state-text">正在加载固定流程...</p>

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
              正常订单流程
            </button>
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? "评估中..." : "运行固定评估" }}
            </button>
          </div>
        </form>

        <section
          class="workflow-bypass-status-panel"
          aria-label="固定流程评估状态"
          aria-live="polite"
        >
          <div class="status-metric">
            <span>服务端决策</span>
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
              <strong>{{ formatWorkflowBypassSignal(step.signal) }}</strong>
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

        <section class="form-panel" aria-label="固定订单与阶段证据">
          <h2>固定订单与阶段证据</h2>
          <ul class="record-list">
            <li v-for="card in contextCards" :key="card.key">
              <strong>{{ card.title }}</strong>
              <span>{{ card.detail }}</span>
            </li>
          </ul>
        </section>

        <section class="form-panel" aria-label="业务流程跳步复盘清单">
          <h2>复盘清单</h2>
          <ul class="record-list">
            <li v-for="item in workflowBypassReviewChecklist" :key="item.key">
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
.workflow-bypass-page {
  align-items: start;
}

.workflow-bypass-workbench,
.workflow-bypass-status-panel {
  display: grid;
  gap: 1rem;
}

.workflow-bypass-status-panel {
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 8px;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.72);
}

.workflow-bypass-status-panel strong,
.lab-note span,
.record-list strong {
  overflow-wrap: anywhere;
}

.decision-step {
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 8px;
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
