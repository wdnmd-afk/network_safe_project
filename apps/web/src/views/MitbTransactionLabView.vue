<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchMitbTransactionWorkbench,
  submitMitbTransactionEvaluation,
  type MitbTransactionResult,
  type MitbTransactionStep,
  type MitbTransactionWorkbench,
} from "../api/mitb-transaction-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createMitbTransactionLearningProgress,
  createMitbTransactionVerificationRecord,
  formatMitbTransactionSignal,
  getMitbTransactionVariantConfig,
  mitbTransactionChecklist,
  mitbTransactionNormalPath,
  mitbTransactionScenarioKey,
  type MitbTransactionVariantKey,
} from "../labs/mitb-transaction";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: MitbTransactionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getMitbTransactionVariantConfig(props.variant));
const workbench = ref<MitbTransactionWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<MitbTransactionResult | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<MitbTransactionStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((left, right) => left.order - right.order)
    : [],
);
const views = computed(() => workbench.value?.transactionViews ?? []);
const assessments = computed(() => workbench.value?.viewAssessments ?? []);

// 首步 optionKey 到固定视图 key 的映射与服务端 viewKeyByAssessmentOption 一致
const viewKeyByOption: Record<string, string> = {
  "trust-browser-rendered-view": "virtual-tampered-transfer-view",
  "compare-server-and-out-of-band-view": "virtual-consistent-transfer-view",
};

const selectedViewKey = computed(
  () =>
    result.value?.viewAssessment?.viewKey ??
    viewKeyByOption[decisions.value[0] ?? ""] ??
    "",
);
const selectedAssessment = computed(
  () =>
    result.value?.viewAssessment ??
    assessments.value.find(
      (assessment) => assessment.viewKey === selectedViewKey.value,
    ) ??
    null,
);
const signalText = computed(() =>
  result.value
    ? formatMitbTransactionSignal(result.value.signal)
    : "尚未运行固定对照",
);

const summaryRows = computed(() => {
  if (!selectedAssessment.value) {
    return [
      { label: "固定视图", value: String(views.value.length) },
      { label: "数据来源", value: "virtual-* 虚构交易" },
      { label: "浏览器读取", value: "未执行" },
      { label: "真实支付", value: "未执行" },
    ];
  }

  return [
    { label: "视图姿态", value: selectedAssessment.value.expectedPosture },
    { label: "发现总数", value: String(selectedAssessment.value.findingCount) },
    {
      label: "三方不一致数",
      value: String(selectedAssessment.value.mismatchCount),
    },
    {
      label: "受信路径控制数",
      value: String(selectedAssessment.value.trustedPathControlCount),
    },
  ];
});

function assessmentFor(viewKey: string) {
  return (
    assessments.value.find((assessment) => assessment.viewKey === viewKey) ??
    null
  );
}

function optionSelectedAt(stepIndex: number) {
  return decisions.value[stepIndex] ?? "";
}

function chooseOption(stepIndex: number, optionKey: string) {
  // 前序策略改变时清除后续选择，保持提交路径与两步状态机一致。
  decisions.value = [...decisions.value.slice(0, stepIndex), optionKey];
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";
}

function applyRecommendedPath() {
  decisions.value = [...config.value.recommendedPath];
  result.value = null;
  actionMessage.value = "已载入推荐固定对照路径";
  errorMessage.value = "";
}

function applyNormalPath() {
  decisions.value = [...mitbTransactionNormalPath];
  result.value = null;
  actionMessage.value = "已载入一致交易正常基线路径";
  errorMessage.value = "";
}

function formatBoolean(value: boolean) {
  return value ? "是" : "否";
}

function isMismatch(left: string, right: string) {
  return left !== right;
}

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "client",
      "mitb",
      session.token,
      createMitbTransactionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定交易视图观察。
  }
}

async function recordVerification(resultValue: MitbTransactionResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "client",
      "mitb",
      session.token,
      createMitbTransactionVerificationRecord(config.value, resultValue),
    );
  } catch {
    // 验证记录失败时仍保留服务端对照结果和事件日志摘要。
  }
}

async function loadWorkbench() {
  isLoading.value = true;
  workbench.value = null;
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await fetchMitbTransactionWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定交易视图工作台加载失败";
  } finally {
    isLoading.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定交易视图对照";
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
    const response = await submitMitbTransactionEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: mitbTransactionScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定交易视图对照失败";
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
  <section class="page-section mitb-page">
    <header class="section-heading mitb-heading">
      <p class="eyebrow">client / mitb transaction view</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <nav class="variant-switch" aria-label="实验版本">
        <RouterLink to="/labs/client/mitb/vuln">风险观察版</RouterLink>
        <RouterLink to="/labs/client/mitb/fixed">防御复盘版</RouterLink>
      </nav>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink class="text-link" to="/labs/client/mitb">
        返回实验详情
      </RouterLink>
    </header>

    <div class="mitb-workbench">
      <p v-if="isLoading" class="state-text">正在加载固定交易视图...</p>

      <template v-else-if="workbench && activeCase">
        <section class="view-section" aria-labelledby="mitb-views-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">fixed transaction views</p>
              <h2 id="mitb-views-heading">虚构交易视图三方对照</h2>
            </div>
            <span>virtual-*</span>
          </div>

          <div class="view-grid">
            <article
              v-for="view in views"
              :key="view.viewKey"
              class="transaction-view"
              :class="{ 'view-selected': selectedViewKey === view.viewKey }"
            >
              <div class="view-header">
                <div>
                  <span>{{ view.expectedPosture }}</span>
                  <h3>{{ view.displayName }}</h3>
                </div>
                <strong>
                  {{ assessmentFor(view.viewKey)?.mismatchCount ?? 0 }} mismatch
                </strong>
              </div>

              <table class="view-table">
                <thead>
                  <tr>
                    <th scope="col">来源</th>
                    <th scope="col">收款方</th>
                    <th scope="col">金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">浏览器显示</th>
                    <td>{{ view.browserPayee }}</td>
                    <td>{{ view.browserAmount }}</td>
                  </tr>
                  <tr
                    :class="{
                      'row-mismatch': isMismatch(
                        view.browserPayee,
                        view.serverPayee,
                      ),
                    }"
                  >
                    <th scope="row">服务端记录</th>
                    <td>{{ view.serverPayee }}</td>
                    <td>{{ view.serverAmount }}</td>
                  </tr>
                  <tr
                    :class="{
                      'row-mismatch': isMismatch(
                        view.browserPayee,
                        view.outOfBandPayee,
                      ),
                    }"
                  >
                    <th scope="row">带外确认</th>
                    <td>{{ view.outOfBandPayee }}</td>
                    <td>{{ view.outOfBandAmount }}</td>
                  </tr>
                </tbody>
              </table>

              <dl>
                <div>
                  <dt>交易已签名</dt>
                  <dd>{{ formatBoolean(view.transactionSigned) }}</dd>
                </div>
                <div>
                  <dt>受信路径控制数</dt>
                  <dd>
                    {{ assessmentFor(view.viewKey)?.trustedPathControlCount ?? 0 }}
                  </dd>
                </div>
              </dl>

              <ul v-if="view.findings.length > 0">
                <li v-for="finding in view.findings" :key="finding">
                  {{ finding }}
                </li>
              </ul>
              <p v-else>固定一致视图未登记风险发现。</p>
            </article>
          </div>
        </section>

        <div class="decision-layout">
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
                @click="applyNormalPath"
              >
                一致交易基线
              </button>
              <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? "对照中..." : "运行固定对照" }}
              </button>
            </div>
          </form>

          <section
            class="audit-status-panel"
            aria-label="固定交易视图对照状态"
            aria-live="polite"
          >
            <div class="status-strip">
              <div>
                <span>服务端决策</span>
                <strong>{{ result?.decision ?? "pending" }}</strong>
              </div>
              <div>
                <span>学习信号</span>
                <strong>{{ signalText }}</strong>
              </div>
            </div>

            <dl class="inspection-grid">
              <div v-for="row in summaryRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>

            <div v-if="result?.transactionDecision" class="decision-summary">
              <span>{{ result.transactionDecision.disposition }}</span>
              <strong>{{ result.transactionDecision.summary }}</strong>
              <p>{{ result.transactionDecision.nextAction }}</p>
            </div>

            <ol v-if="result" class="record-list">
              <li v-for="step in result.steps" :key="step.stepKey">
                <strong>{{ formatMitbTransactionSignal(step.signal) }}</strong>
                <span>{{ step.decision }} / {{ step.outcome }}</span>
                <small>{{ step.explanation }}</small>
              </li>
            </ol>

            <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
            <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <p v-if="!session.token" class="state-text">
              登录后可运行固定对照，并将安全摘要写入实验事件日志。
            </p>
          </section>
        </div>

        <section class="checklist-section" aria-labelledby="mitb-checklist-heading">
          <h2 id="mitb-checklist-heading">受信路径复盘清单</h2>
          <ul>
            <li v-for="item in mitbTransactionChecklist" :key="item.key">
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
.mitb-page,
.mitb-workbench,
.view-section,
.audit-status-panel,
.checklist-section,
.guided-boundaries {
  display: grid;
  gap: 1rem;
}

.mitb-page {
  grid-template-columns: minmax(15rem, 0.34fr) minmax(0, 1fr);
  align-items: start;
}

.mitb-heading {
  position: sticky;
  top: 1rem;
}

.panel-heading,
.view-header,
.status-strip {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.panel-heading h2,
.panel-heading p,
.view-header h3,
.checklist-section h2,
.guided-boundaries h2 {
  margin: 0;
}

.panel-heading > span,
.view-header span,
.decision-summary > span {
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 700;
}

.view-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.transaction-view {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.58);
}

.transaction-view.view-selected {
  border-color: #67e8f9;
}

.view-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.view-table th,
.view-table td {
  padding: 0.45rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(248, 250, 252, 0.08);
  overflow-wrap: anywhere;
}

.view-table thead th {
  color: #94a3b8;
  font-size: 0.76rem;
}

.view-table tbody th {
  color: #cbd5e1;
  font-weight: 600;
}

.view-table .row-mismatch td {
  color: #fca5a5;
  font-weight: 700;
}

.transaction-view dl,
.transaction-view ul,
.transaction-view p,
.checklist-section ul,
.guided-boundaries ul {
  margin: 0;
}

.transaction-view dl {
  display: grid;
  gap: 0.5rem;
}

.transaction-view dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.08);
}

.transaction-view dt,
.status-strip span {
  color: #94a3b8;
  font-size: 0.78rem;
}

.transaction-view dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

.transaction-view ul {
  display: grid;
  gap: 0.4rem;
  padding-left: 1.1rem;
  color: #fca5a5;
}

.transaction-view p {
  color: #86efac;
}

.decision-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.72fr);
  gap: 1rem;
  align-items: start;
}

.decision-step {
  display: grid;
  gap: 0.6rem;
  margin: 0 0 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 8px;
}

.decision-step legend {
  padding: 0 0.4rem;
  font-weight: 700;
}

.decision-options,
.decision-summary {
  display: grid;
  gap: 0.5rem;
}

.option-active {
  border-color: #67e8f9;
  color: #67e8f9;
  font-weight: 700;
}

.audit-status-panel {
  padding: 1rem;
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
}

.status-strip > div {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.status-strip strong,
.decision-summary strong {
  overflow-wrap: anywhere;
}

.decision-summary {
  padding-top: 0.85rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
}

.decision-summary p {
  margin: 0;
  color: #cbd5e1;
}

.checklist-section,
.guided-boundaries {
  padding-top: 1rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
}

.checklist-section ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1.25rem;
  padding: 0;
  list-style: none;
}

.checklist-section li {
  display: grid;
  gap: 0.3rem;
}

.checklist-section span,
.guided-boundaries li {
  color: #cbd5e1;
  line-height: 1.6;
}

.guided-boundaries ul {
  display: grid;
  gap: 0.6rem;
  padding-left: 1.2rem;
}

.text-link {
  color: #67e8f9;
  font-weight: 700;
}

@media (max-width: 960px) {
  .mitb-page,
  .decision-layout,
  .view-grid {
    grid-template-columns: 1fr;
  }

  .mitb-heading {
    position: static;
  }
}

@media (max-width: 640px) {
  .panel-heading,
  .view-header,
  .status-strip,
  .transaction-view dl > div {
    flex-direction: column;
  }

  .transaction-view dd {
    text-align: left;
  }

  .checklist-section ul {
    grid-template-columns: 1fr;
  }
}
</style>
