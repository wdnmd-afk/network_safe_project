<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchRuleAlertTriageWorkbench,
  submitRuleAlertTriageEvaluation,
  type FixedDetectionRuleAnalysis,
  type RuleAlertTriageResult,
  type RuleAlertTriageStep,
  type RuleAlertTriageWorkbench,
} from "../api/rule-alert-triage-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createRuleAlertTriageLearningProgress,
  createRuleAlertTriageVerificationRecord,
  formatRuleAlertTriageSignal,
  formatRuleProfileTitle,
  getRuleAlertTriageVariantConfig,
  ruleAlertTriageNormalPath,
  ruleAlertTriageReviewChecklist,
  ruleAlertTriageScenarioKey,
  type RuleAlertTriageVariantKey,
} from "../labs/rule-alert-triage";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: RuleAlertTriageVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getRuleAlertTriageVariantConfig(props.variant));
const workbench = ref<RuleAlertTriageWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<RuleAlertTriageResult | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<RuleAlertTriageStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((left, right) => left.order - right.order)
    : [],
);
const events = computed(() => workbench.value?.dataset.events ?? []);
const ruleProfiles = computed(() => workbench.value?.dataset.ruleProfiles ?? []);
const ruleAnalyses = computed(() => workbench.value?.ruleAnalyses ?? []);

const ruleProfileByOption: Record<string, string> = {
  "trust-broad-single-signal-rule": "broad-auth-failure-rule",
  "trust-narrow-single-signal-rule": "narrow-unsigned-process-rule",
  "correlate-multi-source-signals":
    "correlated-auth-process-network-rule",
};

const selectedRuleAnalysis = computed<FixedDetectionRuleAnalysis | null>(() => {
  if (result.value?.ruleAnalysis) {
    return result.value.ruleAnalysis;
  }

  const selectedProfileKey = ruleProfileByOption[decisions.value[0] ?? ""];
  return (
    ruleAnalyses.value.find(
      (analysis) => analysis.ruleProfileKey === selectedProfileKey,
    ) ?? null
  );
});

const signalText = computed(() =>
  result.value
    ? formatRuleAlertTriageSignal(result.value.signal)
    : "尚未运行固定研判",
);

const summaryRows = computed(() => {
  const analysis = result.value?.ruleAnalysis ?? selectedRuleAnalysis.value;

  if (!analysis) {
    return [
      { label: "固定事件", value: String(events.value.length) },
      { label: "规则画像", value: String(ruleAnalyses.value.length) },
      { label: "事件来源", value: "认证 / 进程 / 网络" },
      { label: "真实系统", value: "未连接" },
    ];
  }

  return [
    { label: "当前规则", value: formatRuleProfileTitle(analysis.ruleProfileKey) },
    { label: "真正例 TP", value: String(analysis.truePositiveCount) },
    { label: "误报 FP", value: String(analysis.falsePositiveCount) },
    { label: "漏报 FN", value: String(analysis.falseNegativeCount) },
    { label: "准确率", value: `${analysis.precisionPercent}%` },
    { label: "召回率", value: `${analysis.recallPercent}%` },
  ];
});

function optionSelectedAt(stepIndex: number) {
  return decisions.value[stepIndex] ?? "";
}

function chooseOption(stepIndex: number, optionKey: string) {
  // 修改前序决策时丢弃后续选择，确保提交路径与页面状态机顺序一致。
  decisions.value = [...decisions.value.slice(0, stepIndex), optionKey];
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";
}

function applyRecommendedPath() {
  decisions.value = [...config.value.recommendedPath];
  result.value = null;
  actionMessage.value = "已载入推荐固定研判路径";
  errorMessage.value = "";
}

function applyNormalPath() {
  decisions.value = [...ruleAlertTriageNormalPath];
  result.value = null;
  actionMessage.value = "已载入维护事件正常关闭路径";
  errorMessage.value = "";
}

function ruleProfileFor(key: string) {
  return ruleProfiles.value.find((profile) => profile.key === key) ?? null;
}

function eventMatched(eventId: string) {
  return selectedRuleAnalysis.value?.matchedEventIds.includes(eventId) ?? false;
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    "virtual-auth-service": "虚拟认证服务",
    "virtual-endpoint": "虚拟终端",
    "virtual-network-sensor": "虚拟网络传感器",
  };

  return labels[source] ?? source;
}

function formatDisposition(disposition: string) {
  return disposition === "suspicious" ? "可疑基线" : "正常基线";
}

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "detection",
      "rule-alert-triage",
      session.token,
      createRuleAlertTriageLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定事件与规则指标观察。
  }
}

async function recordVerification(resultValue: RuleAlertTriageResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "detection",
      "rule-alert-triage",
      session.token,
      createRuleAlertTriageVerificationRecord(config.value, resultValue),
    );
  } catch {
    // 验证记录失败时仍保留服务端研判结果和事件日志摘要。
  }
}

async function loadWorkbench() {
  isLoading.value = true;
  workbench.value = null;
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await fetchRuleAlertTriageWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定检测工作台加载失败";
  } finally {
    isLoading.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定告警研判";
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
    const response = await submitRuleAlertTriageEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: ruleAlertTriageScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定告警研判失败";
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
  <section class="page-section rule-alert-triage-page">
    <header class="section-heading triage-heading">
      <p class="eyebrow">detection / rule alert triage</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <nav class="variant-switch" aria-label="实验版本">
        <RouterLink to="/labs/detection/rule-alert-triage/vuln">
          风险观察版
        </RouterLink>
        <RouterLink to="/labs/detection/rule-alert-triage/fixed">
          防御复盘版
        </RouterLink>
      </nav>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink class="text-link" to="/labs/detection/rule-alert-triage">
        返回实验详情
      </RouterLink>
    </header>

    <div class="triage-workbench">
      <p v-if="isLoading" class="state-text">正在加载固定检测数据...</p>

      <template v-else-if="workbench && activeCase">
        <section class="timeline-section" aria-labelledby="fixed-event-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">fixed dataset</p>
              <h2 id="fixed-event-heading">{{ workbench.dataset.title }}</h2>
            </div>
            <span>{{ events.length }} 条事件</span>
          </div>
          <p class="form-hint">{{ workbench.dataset.description }}</p>

          <ol class="event-timeline">
            <li
              v-for="event in events"
              :key="event.eventId"
              :class="{
                'event-matched': eventMatched(event.eventId),
                'event-benign': event.expectedDisposition === 'benign',
              }"
            >
              <time>{{ event.timestamp }}</time>
              <div>
                <div class="event-heading">
                  <strong>{{ event.summary }}</strong>
                  <span>{{ formatDisposition(event.expectedDisposition) }}</span>
                </div>
                <p>
                  {{ formatSource(event.source) }} · {{ event.category }} ·
                  {{ event.severity }}
                </p>
                <small>{{ event.signalTags.join(" / ") }}</small>
              </div>
            </li>
          </ol>
        </section>

        <section class="rule-section" aria-labelledby="rule-analysis-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">rule comparison</p>
              <h2 id="rule-analysis-heading">固定规则画像指标</h2>
            </div>
            <span>TP / FP / FN</span>
          </div>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>规则画像</th>
                  <th>TP</th>
                  <th>FP</th>
                  <th>FN</th>
                  <th>准确率</th>
                  <th>召回率</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="analysis in ruleAnalyses"
                  :key="analysis.ruleProfileKey"
                  :class="{
                    'rule-selected':
                      selectedRuleAnalysis?.ruleProfileKey ===
                      analysis.ruleProfileKey,
                  }"
                >
                  <td>
                    <strong>{{ formatRuleProfileTitle(analysis.ruleProfileKey) }}</strong>
                    <small>{{ ruleProfileFor(analysis.ruleProfileKey)?.description }}</small>
                  </td>
                  <td>{{ analysis.truePositiveCount }}</td>
                  <td>{{ analysis.falsePositiveCount }}</td>
                  <td>{{ analysis.falseNegativeCount }}</td>
                  <td>{{ analysis.precisionPercent }}%</td>
                  <td>{{ analysis.recallPercent }}%</td>
                </tr>
              </tbody>
            </table>
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
                正常维护路径
              </button>
              <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? "研判中..." : "运行固定研判" }}
              </button>
            </div>
          </form>

          <section
            class="triage-status-panel"
            aria-label="固定告警研判状态"
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

            <div v-if="result?.triage" class="triage-summary">
              <span>{{ result.triage.disposition }}</span>
              <strong>{{ result.triage.summary }}</strong>
              <p>{{ result.triage.nextAction }}</p>
            </div>

            <ol v-if="result" class="record-list">
              <li v-for="step in result.steps" :key="step.stepKey">
                <strong>{{ formatRuleAlertTriageSignal(step.signal) }}</strong>
                <span>{{ step.decision }} / {{ step.outcome }}</span>
                <small>{{ step.explanation }}</small>
              </li>
            </ol>

            <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
            <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <p v-if="!session.token" class="state-text">
              登录后可运行固定研判，并将安全摘要写入实验事件日志。
            </p>
          </section>
        </div>

        <section class="review-section" aria-labelledby="triage-review-heading">
          <h2 id="triage-review-heading">研判复盘清单</h2>
          <ul>
            <li v-for="item in ruleAlertTriageReviewChecklist" :key="item.key">
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
.rule-alert-triage-page,
.triage-workbench,
.timeline-section,
.rule-section,
.triage-status-panel,
.review-section,
.guided-boundaries {
  display: grid;
  gap: 1rem;
}

.rule-alert-triage-page {
  grid-template-columns: minmax(15rem, 0.34fr) minmax(0, 1fr);
  align-items: start;
}

.triage-heading {
  position: sticky;
  top: 1rem;
}

.panel-heading,
.event-heading,
.status-strip {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.panel-heading h2,
.panel-heading p,
.review-section h2,
.guided-boundaries h2 {
  margin: 0;
}

.panel-heading > span,
.event-heading span,
.triage-summary > span {
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 700;
}

.event-timeline,
.review-section ul,
.guided-boundaries ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.event-timeline {
  display: grid;
  border-top: 1px solid rgba(248, 250, 252, 0.12);
}

.event-timeline li {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.9rem 0.75rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
  border-left: 3px solid transparent;
}

.event-timeline li.event-matched {
  border-left-color: #67e8f9;
  background: rgba(34, 211, 238, 0.08);
}

.event-timeline li.event-benign {
  color: #cbd5e1;
}

.event-timeline time {
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-weight: 700;
}

.event-heading strong,
.event-heading span,
.event-timeline p,
.event-timeline small,
.triage-summary strong,
.status-strip strong {
  overflow-wrap: anywhere;
}

.event-timeline p,
.event-timeline small {
  display: block;
  margin: 0.35rem 0 0;
  color: #94a3b8;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 44rem;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
  text-align: left;
  vertical-align: top;
}

th {
  color: #94a3b8;
  font-size: 0.78rem;
  text-transform: uppercase;
}

td:first-child {
  width: 46%;
}

td small {
  display: block;
  margin-top: 0.25rem;
  color: #94a3b8;
  line-height: 1.45;
}

.rule-selected {
  background: rgba(34, 211, 238, 0.08);
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
.triage-summary {
  display: grid;
  gap: 0.5rem;
}

.option-active {
  border-color: #67e8f9;
  color: #67e8f9;
  font-weight: 700;
}

.triage-status-panel {
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

.status-strip span {
  color: #94a3b8;
  font-size: 0.78rem;
}

.triage-summary {
  padding-top: 0.85rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
}

.triage-summary p {
  margin: 0;
  color: #cbd5e1;
}

.review-section,
.guided-boundaries {
  padding-top: 1rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
}

.review-section ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1.25rem;
}

.review-section li {
  display: grid;
  gap: 0.3rem;
}

.review-section span,
.guided-boundaries li {
  color: #cbd5e1;
  line-height: 1.6;
}

.guided-boundaries ul {
  display: grid;
  gap: 0.6rem;
  padding-left: 1.2rem;
  list-style: disc;
}

.text-link {
  color: #67e8f9;
  font-weight: 700;
}

@media (max-width: 960px) {
  .rule-alert-triage-page,
  .decision-layout {
    grid-template-columns: 1fr;
  }

  .triage-heading {
    position: static;
  }
}

@media (max-width: 640px) {
  .panel-heading,
  .event-heading,
  .status-strip {
    flex-direction: column;
  }

  .event-timeline li {
    grid-template-columns: 1fr;
  }

  .review-section ul {
    grid-template-columns: 1fr;
  }
}
</style>
