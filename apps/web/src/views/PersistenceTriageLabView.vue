<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchPersistenceTriageWorkbench,
  submitPersistenceTriageEvaluation,
  type PersistenceTriageResult,
  type PersistenceTriageStep,
  type PersistenceTriageWorkbench,
} from "../api/persistence-triage-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createPersistenceTriageLearningProgress,
  createPersistenceTriageVerificationRecord,
  entryKeyByAssessmentOption,
  formatPersistenceTriageSignal,
  getPersistenceTriageVariantConfig,
  persistenceTriageChecklist,
  persistenceTriageNormalPath,
  persistenceTriageScenarioKey,
  type PersistenceTriageVariantKey,
} from "../labs/persistence-triage";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PersistenceTriageVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPersistenceTriageVariantConfig(props.variant));
const workbench = ref<PersistenceTriageWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<PersistenceTriageResult | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<PersistenceTriageStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((left, right) => left.order - right.order)
    : [],
);
const entries = computed(() => workbench.value?.entrySnapshots ?? []);
const assessments = computed(() => workbench.value?.entryAssessments ?? []);

const selectedEntryKey = computed(
  () =>
    result.value?.entryAssessment?.entryKey ??
    entryKeyByAssessmentOption[decisions.value[0] ?? ""] ??
    "",
);
const selectedAssessment = computed(
  () =>
    result.value?.entryAssessment ??
    assessments.value.find(
      (assessment) => assessment.entryKey === selectedEntryKey.value,
    ) ??
    null,
);
const signalText = computed(() =>
  result.value
    ? formatPersistenceTriageSignal(result.value.signal)
    : "尚未运行固定研判",
);

const summaryRows = computed(() => {
  if (!selectedAssessment.value) {
    return [
      { label: "固定条目", value: String(entries.value.length) },
      { label: "数据来源", value: "virtual-* 虚构快照" },
      { label: "真实注册表读取", value: "未执行" },
      { label: "真实任务变更", value: "未执行" },
    ];
  }

  return [
    { label: "条目姿态", value: selectedAssessment.value.expectedPosture },
    { label: "发现总数", value: String(selectedAssessment.value.findingCount) },
    {
      label: "关键组合风险",
      value: String(selectedAssessment.value.criticalFindingCount),
    },
    {
      label: "加固控制数",
      value: String(selectedAssessment.value.hardeningControlCount),
    },
  ];
});

function assessmentFor(entryKey: string) {
  return (
    assessments.value.find((assessment) => assessment.entryKey === entryKey) ??
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
  actionMessage.value = "已载入推荐固定研判路径";
  errorMessage.value = "";
}

function applyNormalPath() {
  decisions.value = [...persistenceTriageNormalPath];
  result.value = null;
  actionMessage.value = "已载入受控自启正常基线路径";
  errorMessage.value = "";
}

function formatScope(scope: string) {
  const labels: Record<string, string> = {
    unsigned: "未签名",
    "publisher-verified": "发布者已验证",
    "user-writable": "标准用户可写",
    "admin-only-writable": "仅管理员可写",
    "logon-high-frequency": "登录高频触发",
    "scheduled-window": "计划窗口触发",
    "high-privilege-account": "高权限账户",
    "least-privilege-account": "最小权限账户",
    none: "未启用",
    "change-audited-and-alerted": "变更审计并告警",
  };

  return labels[scope] ?? scope;
}

function formatBoolean(value: boolean) {
  return value ? "是" : "否";
}

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "host",
      "persistence-triage",
      session.token,
      createPersistenceTriageLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定证据观察。
  }
}

async function recordVerification(resultValue: PersistenceTriageResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "host",
      "persistence-triage",
      session.token,
      createPersistenceTriageVerificationRecord(config.value, resultValue),
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
    const response = await fetchPersistenceTriageWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定持久化时间线加载失败";
  } finally {
    isLoading.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定持久化研判";
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
    const response = await submitPersistenceTriageEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: persistenceTriageScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定持久化研判失败";
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
  <section class="page-section persistence-page">
    <header class="section-heading persistence-heading">
      <p class="eyebrow">host / persistence triage</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <nav class="variant-switch" aria-label="实验版本">
        <RouterLink to="/labs/host/persistence-triage/vuln">
          风险观察版
        </RouterLink>
        <RouterLink to="/labs/host/persistence-triage/fixed">
          处置复盘版
        </RouterLink>
      </nav>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink class="text-link" to="/labs/host/persistence-triage">
        返回实验详情
      </RouterLink>
    </header>

    <div class="persistence-workbench">
      <p v-if="isLoading" class="state-text">正在加载固定持久化条目快照...</p>

      <template v-else-if="workbench && activeCase">
        <section class="entry-section" aria-labelledby="persistence-entries-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">fixed entries</p>
              <h2 id="persistence-entries-heading">虚构持久化条目对比</h2>
            </div>
            <span>virtual-*</span>
          </div>

          <div class="entry-grid">
            <article
              v-for="entry in entries"
              :key="entry.entryKey"
              class="entry-snapshot"
              :class="{
                'entry-selected': selectedEntryKey === entry.entryKey,
              }"
            >
              <div class="entry-header">
                <div>
                  <span>{{ entry.expectedPosture }}</span>
                  <h3>{{ entry.displayName }}</h3>
                </div>
                <strong>
                  {{ assessmentFor(entry.entryKey)?.findingCount ?? 0 }} findings
                </strong>
              </div>

              <code>{{ entry.entryKey }}</code>

              <dl>
                <div>
                  <dt>映像签名</dt>
                  <dd>{{ formatScope(entry.signatureScope) }}</dd>
                </div>
                <div>
                  <dt>映像路径 ACL</dt>
                  <dd>{{ formatScope(entry.imagePathAclScope) }}</dd>
                </div>
                <div>
                  <dt>触发方式</dt>
                  <dd>{{ formatScope(entry.triggerScope) }}</dd>
                </div>
                <div>
                  <dt>运行账户</dt>
                  <dd>{{ formatScope(entry.runAccountScope) }}</dd>
                </div>
                <div>
                  <dt>变更审计</dt>
                  <dd>{{ formatScope(entry.auditScope) }}</dd>
                </div>
                <div>
                  <dt>标准用户可篡改</dt>
                  <dd>{{ formatBoolean(entry.tamperableByStandardUser) }}</dd>
                </div>
              </dl>

              <ul v-if="entry.findings.length > 0">
                <li v-for="finding in entry.findings" :key="finding">
                  {{ finding }}
                </li>
              </ul>
              <p v-else>固定受控自启条目未登记风险发现。</p>
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
                受控自启基线
              </button>
              <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? "研判中..." : "运行固定研判" }}
              </button>
            </div>
          </form>

          <section
            class="triage-status-panel"
            aria-label="固定持久化研判状态"
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

            <div v-if="result?.entryDecision" class="decision-summary">
              <span>{{ result.entryDecision.disposition }}</span>
              <strong>{{ result.entryDecision.summary }}</strong>
              <p>{{ result.entryDecision.nextAction }}</p>
            </div>

            <ol v-if="result" class="record-list">
              <li v-for="step in result.steps" :key="step.stepKey">
                <strong>{{ formatPersistenceTriageSignal(step.signal) }}</strong>
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

        <section
          class="checklist-section"
          aria-labelledby="persistence-checklist-heading"
        >
          <h2 id="persistence-checklist-heading">持久化加固复盘清单</h2>
          <ul>
            <li v-for="item in persistenceTriageChecklist" :key="item.key">
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
.persistence-page,
.persistence-workbench,
.entry-section,
.triage-status-panel,
.checklist-section,
.guided-boundaries {
  display: grid;
  gap: 1rem;
}

.persistence-page {
  grid-template-columns: minmax(15rem, 0.34fr) minmax(0, 1fr);
  align-items: start;
}

.persistence-heading {
  position: sticky;
  top: 1rem;
}

.panel-heading,
.entry-header,
.status-strip {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.panel-heading h2,
.panel-heading p,
.entry-header h3,
.checklist-section h2,
.guided-boundaries h2 {
  margin: 0;
}

.panel-heading > span,
.entry-header span,
.decision-summary > span {
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 700;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.entry-snapshot {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.58);
}

.entry-snapshot.entry-selected {
  border-color: #67e8f9;
}

.entry-snapshot code {
  display: block;
  padding: 0.7rem;
  color: #e2e8f0;
  background: rgba(2, 6, 23, 0.72);
  overflow-wrap: anywhere;
  white-space: normal;
}

.entry-snapshot dl,
.entry-snapshot ul,
.entry-snapshot p,
.checklist-section ul,
.guided-boundaries ul {
  margin: 0;
}

.entry-snapshot dl {
  display: grid;
  gap: 0.5rem;
}

.entry-snapshot dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.08);
}

.entry-snapshot dt,
.status-strip span {
  color: #94a3b8;
  font-size: 0.78rem;
}

.entry-snapshot dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

.entry-snapshot ul {
  display: grid;
  gap: 0.4rem;
  padding-left: 1.1rem;
  color: #fca5a5;
}

.entry-snapshot p {
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
  .persistence-page,
  .decision-layout,
  .entry-grid {
    grid-template-columns: 1fr;
  }

  .persistence-heading {
    position: static;
  }
}

@media (max-width: 640px) {
  .panel-heading,
  .entry-header,
  .status-strip,
  .entry-snapshot dl > div {
    flex-direction: column;
  }

  .entry-snapshot dd {
    text-align: left;
  }

  .checklist-section ul {
    grid-template-columns: 1fr;
  }
}
</style>
