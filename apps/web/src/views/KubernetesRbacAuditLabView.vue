<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchKubernetesRbacAuditWorkbench,
  submitKubernetesRbacAuditEvaluation,
  type KubernetesRbacAuditResult,
  type KubernetesRbacAuditStep,
  type KubernetesRbacAuditWorkbench,
} from "../api/kubernetes-rbac-audit-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  bindingKeyByAssessmentOption,
  createKubernetesRbacAuditLearningProgress,
  createKubernetesRbacAuditVerificationRecord,
  formatKubernetesRbacAuditSignal,
  getKubernetesRbacAuditVariantConfig,
  kubernetesRbacAuditChecklist,
  kubernetesRbacAuditNormalPath,
  kubernetesRbacAuditScenarioKey,
  type KubernetesRbacAuditVariantKey,
} from "../labs/kubernetes-rbac-audit";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: KubernetesRbacAuditVariantKey;
}>();

const session = useSessionStore();
const config = computed(() =>
  getKubernetesRbacAuditVariantConfig(props.variant),
);
const workbench = ref<KubernetesRbacAuditWorkbench | null>(null);
const decisions = ref<string[]>([]);
const result = ref<KubernetesRbacAuditResult | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<KubernetesRbacAuditStep[]>(() =>
  activeCase.value
    ? [...activeCase.value.steps].sort((left, right) => left.order - right.order)
    : [],
);
const bindings = computed(() => workbench.value?.bindingSnapshots ?? []);
const assessments = computed(() => workbench.value?.bindingAssessments ?? []);

const selectedBindingKey = computed(
  () =>
    result.value?.bindingAssessment?.bindingKey ??
    bindingKeyByAssessmentOption[decisions.value[0] ?? ""] ??
    "",
);
const selectedAssessment = computed(
  () =>
    result.value?.bindingAssessment ??
    assessments.value.find(
      (assessment) => assessment.bindingKey === selectedBindingKey.value,
    ) ??
    null,
);
const signalText = computed(() =>
  result.value
    ? formatKubernetesRbacAuditSignal(result.value.signal)
    : "尚未运行固定审计",
);

const summaryRows = computed(() => {
  if (!selectedAssessment.value) {
    return [
      { label: "固定绑定", value: String(bindings.value.length) },
      { label: "数据来源", value: "virtual-* 虚构清单" },
      { label: "集群连接", value: "未执行" },
      { label: "真实绑定修改", value: "未执行" },
    ];
  }

  return [
    { label: "绑定姿态", value: selectedAssessment.value.expectedPosture },
    { label: "发现总数", value: String(selectedAssessment.value.findingCount) },
    {
      label: "关键组合风险",
      value: String(selectedAssessment.value.criticalFindingCount),
    },
    {
      label: "最小权限控制数",
      value: String(selectedAssessment.value.leastPrivilegeControlCount),
    },
  ];
});

function assessmentFor(bindingKey: string) {
  return (
    assessments.value.find(
      (assessment) => assessment.bindingKey === bindingKey,
    ) ?? null
  );
}

function optionSelectedAt(stepIndex: number) {
  return decisions.value[stepIndex] ?? "";
}

function chooseOption(stepIndex: number, optionKey: string) {
  // 前序判定改变时清除后续选择，保持提交路径与两步状态机一致。
  decisions.value = [...decisions.value.slice(0, stepIndex), optionKey];
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";
}

function applyRecommendedPath() {
  decisions.value = [...config.value.recommendedPath];
  result.value = null;
  actionMessage.value = "已载入推荐固定审计路径";
  errorMessage.value = "";
}

function applyNormalPath() {
  decisions.value = [...kubernetesRbacAuditNormalPath];
  result.value = null;
  actionMessage.value = "已载入命名空间最小权限基线路径";
  errorMessage.value = "";
}

function formatScope(scope: string) {
  const labels: Record<string, string> = {
    "cluster-wide": "全集群（ClusterRole）",
    "namespace-scoped": "限命名空间（Role）",
    "wildcard-all": "通配符（全部）",
    "write-verbs": "含写入动词",
    "read-only-verbs": "只读动词",
    "explicit-resources": "显式资源列表",
    "broad-group": "宽泛组主体",
    "named-service-account": "具名 ServiceAccount",
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
      "infrastructure",
      "kubernetes-rbac-audit",
      session.token,
      createKubernetesRbacAuditLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断固定清单观察。
  }
}

async function recordVerification(resultValue: KubernetesRbacAuditResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "infrastructure",
      "kubernetes-rbac-audit",
      session.token,
      createKubernetesRbacAuditVerificationRecord(config.value, resultValue),
    );
  } catch {
    // 验证记录失败时仍保留服务端审计结果和事件日志摘要。
  }
}

async function loadWorkbench() {
  isLoading.value = true;
  workbench.value = null;
  result.value = null;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await fetchKubernetesRbacAuditWorkbench();
    workbench.value = response.workbench;
    decisions.value = [...config.value.recommendedPath];
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定 RBAC 清单工作台加载失败";
  } finally {
    isLoading.value = false;
  }
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定 RBAC 审计";
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
    const response = await submitKubernetesRbacAuditEvaluation(
      config.value.key,
      session.token,
      {
        scenarioKey: kubernetesRbacAuditScenarioKey,
        decisions: decisions.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定 RBAC 审计失败";
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
  <section class="page-section rbac-audit-page">
    <header class="section-heading rbac-audit-heading">
      <p class="eyebrow">infrastructure / kubernetes rbac audit</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <nav class="variant-switch" aria-label="实验版本">
        <RouterLink to="/labs/infrastructure/kubernetes-rbac-audit/vuln">
          风险观察版
        </RouterLink>
        <RouterLink to="/labs/infrastructure/kubernetes-rbac-audit/fixed">
          防御复盘版
        </RouterLink>
      </nav>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>

      <RouterLink
        class="text-link"
        to="/labs/infrastructure/kubernetes-rbac-audit"
      >
        返回实验详情
      </RouterLink>
    </header>

    <div class="rbac-audit-workbench">
      <p v-if="isLoading" class="state-text">正在加载固定 RBAC 绑定清单...</p>

      <template v-else-if="workbench && activeCase">
        <section class="binding-section" aria-labelledby="rbac-bindings-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">fixed bindings</p>
              <h2 id="rbac-bindings-heading">虚构 RBAC 绑定对比</h2>
            </div>
            <span>virtual-*</span>
          </div>

          <div class="binding-grid">
            <article
              v-for="binding in bindings"
              :key="binding.bindingKey"
              class="binding-snapshot"
              :class="{
                'binding-selected': selectedBindingKey === binding.bindingKey,
              }"
            >
              <div class="binding-header">
                <div>
                  <span>{{ binding.expectedPosture }}</span>
                  <h3>{{ binding.displayName }}</h3>
                </div>
                <strong>
                  {{ assessmentFor(binding.bindingKey)?.findingCount ?? 0 }}
                  findings
                </strong>
              </div>

              <code>{{ binding.bindingKey }}</code>

              <dl>
                <div>
                  <dt>主体类型</dt>
                  <dd>{{ formatScope(binding.subjectScope) }}</dd>
                </div>
                <div>
                  <dt>动词范围</dt>
                  <dd>{{ formatScope(binding.verbScope) }}</dd>
                </div>
                <div>
                  <dt>资源范围</dt>
                  <dd>{{ formatScope(binding.resourceScope) }}</dd>
                </div>
                <div>
                  <dt>角色作用域</dt>
                  <dd>{{ formatScope(binding.roleScope) }}</dd>
                </div>
                <div>
                  <dt>Secret 可读</dt>
                  <dd>{{ formatBoolean(binding.secretsReadable) }}</dd>
                </div>
                <div>
                  <dt>提权可达</dt>
                  <dd>
                    {{ formatBoolean(binding.privilegeEscalationReachable) }}
                  </dd>
                </div>
              </dl>

              <ul v-if="binding.findings.length > 0">
                <li v-for="finding in binding.findings" :key="finding">
                  {{ finding }}
                </li>
              </ul>
              <p v-else>固定最小权限绑定未登记风险发现。</p>
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
                命名空间基线
              </button>
              <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? "审计中..." : "运行固定审计" }}
              </button>
            </div>
          </form>

          <section
            class="audit-status-panel"
            aria-label="固定 RBAC 审计状态"
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

            <div v-if="result?.bindingDecision" class="decision-summary">
              <span>{{ result.bindingDecision.disposition }}</span>
              <strong>{{ result.bindingDecision.summary }}</strong>
              <p>{{ result.bindingDecision.nextAction }}</p>
            </div>

            <ol v-if="result" class="record-list">
              <li v-for="step in result.steps" :key="step.stepKey">
                <strong>
                  {{ formatKubernetesRbacAuditSignal(step.signal) }}
                </strong>
                <span>{{ step.decision }} / {{ step.outcome }}</span>
                <small>{{ step.explanation }}</small>
              </li>
            </ol>

            <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
            <p v-if="result?.nextStep" class="state-text">
              {{ result.nextStep }}
            </p>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <p v-if="!session.token" class="state-text">
              登录后可运行固定审计，并将安全摘要写入实验事件日志。
            </p>
          </section>
        </div>

        <section
          class="checklist-section"
          aria-labelledby="rbac-checklist-heading"
        >
          <h2 id="rbac-checklist-heading">最小权限复盘清单</h2>
          <ul>
            <li v-for="item in kubernetesRbacAuditChecklist" :key="item.key">
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
.rbac-audit-page,
.rbac-audit-workbench,
.binding-section,
.audit-status-panel,
.checklist-section,
.guided-boundaries {
  display: grid;
  gap: 1rem;
}

.rbac-audit-page {
  grid-template-columns: minmax(15rem, 0.34fr) minmax(0, 1fr);
  align-items: start;
}

.rbac-audit-heading {
  position: sticky;
  top: 1rem;
}

.panel-heading,
.binding-header,
.status-strip {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.panel-heading h2,
.panel-heading p,
.binding-header h3,
.checklist-section h2,
.guided-boundaries h2 {
  margin: 0;
}

.panel-heading > span,
.binding-header span,
.decision-summary > span {
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 700;
}

.binding-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.binding-snapshot {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.58);
}

.binding-snapshot.binding-selected {
  border-color: #67e8f9;
}

.binding-snapshot code {
  display: block;
  padding: 0.7rem;
  color: #e2e8f0;
  background: rgba(2, 6, 23, 0.72);
  overflow-wrap: anywhere;
  white-space: normal;
}

.binding-snapshot dl,
.binding-snapshot ul,
.binding-snapshot p,
.checklist-section ul,
.guided-boundaries ul {
  margin: 0;
}

.binding-snapshot dl {
  display: grid;
  gap: 0.5rem;
}

.binding-snapshot dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.08);
}

.binding-snapshot dt,
.status-strip span {
  color: #94a3b8;
  font-size: 0.78rem;
}

.binding-snapshot dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

.binding-snapshot ul {
  display: grid;
  gap: 0.4rem;
  padding-left: 1.1rem;
  color: #fca5a5;
}

.binding-snapshot p {
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
  .rbac-audit-page,
  .decision-layout,
  .binding-grid {
    grid-template-columns: 1fr;
  }

  .rbac-audit-heading {
    position: static;
  }
}

@media (max-width: 640px) {
  .panel-heading,
  .binding-header,
  .status-strip,
  .binding-snapshot dl > div {
    flex-direction: column;
  }

  .binding-snapshot dd {
    text-align: left;
  }

  .checklist-section ul {
    grid-template-columns: 1fr;
  }
}
</style>
