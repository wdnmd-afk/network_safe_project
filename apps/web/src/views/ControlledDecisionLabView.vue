<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { fetchControlledWorkbench, submitControlledEvaluation, type ControlledResult, type ControlledStep } from "../api/controlled-decision-lab";
import { recordLearningProgress, recordVerificationRecord } from "../api/lab-records";
import { createControlledLearningProgress, createControlledVerificationRecord, formatControlledSignal, getControlledLabPageConfig } from "../labs/controlled-decision-labs";
import { useSessionStore } from "../stores/session";

const props = defineProps<{ category: string; scene: string; variant: "vuln" | "fixed" }>();
const session = useSessionStore();
const config = computed(() => getControlledLabPageConfig(props.category, props.scene));
const workbench = ref<Awaited<ReturnType<typeof fetchControlledWorkbench>>["workbench"] | null>(null);
const decisions = ref<string[]>([]);
const result = ref<ControlledResult | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const actionMessage = ref("");
const activeCase = computed(() => workbench.value?.cases[0] ?? null);
const orderedSteps = computed<ControlledStep[]>(() => activeCase.value ? [...activeCase.value.steps].sort((left, right) => left.order - right.order) : []);
const pageTitle = computed(() => props.variant === "vuln" ? config.value.vulnTitle : config.value.fixedTitle);
const signalText = computed(() => result.value ? formatControlledSignal(result.value.signal, config.value) : "尚未运行固定评估");

function optionSelectedAt(index: number) { return decisions.value[index] ?? ""; }
function chooseOption(index: number, optionKey: string) {
  decisions.value = [...decisions.value.slice(0, index), optionKey];
  result.value = null;
  errorMessage.value = "";
  actionMessage.value = "";
}
function applyRecommendedPath() { decisions.value = [...config.value.recommendedPath[props.variant]]; result.value = null; actionMessage.value = "已载入推荐路径"; errorMessage.value = ""; }
function applyNormalPath() { decisions.value = [...config.value.normalPath]; result.value = null; actionMessage.value = "已载入正常路径"; errorMessage.value = ""; }

async function recordProgress() {
  if (!session.token) return;
  try { await recordLearningProgress(props.category, props.scene, session.token, createControlledLearningProgress(config.value, props.variant)); } catch { /* 记录失败不阻断固定实验 */ }
}
async function recordResult(value: ControlledResult) {
  if (!session.token) return;
  try { await recordVerificationRecord(props.category, props.scene, session.token, createControlledVerificationRecord(config.value, props.variant, value)); } catch { /* 记录失败不改变评估结果 */ }
}
async function loadWorkbench() {
  isLoading.value = true; workbench.value = null; result.value = null; errorMessage.value = "";
  try { const response = await fetchControlledWorkbench(props.category, props.scene); workbench.value = response.workbench; decisions.value = [...config.value.recommendedPath[props.variant]]; await recordProgress(); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : "固定工作台加载失败"; }
  finally { isLoading.value = false; }
}
async function submitEvaluation() {
  if (!session.token) { errorMessage.value = "请先登录后再运行固定评估"; return; }
  if (decisions.value.length !== orderedSteps.value.length) { errorMessage.value = "请为每个步骤选择固定决策"; return; }
  isSubmitting.value = true; errorMessage.value = ""; actionMessage.value = "";
  try { const response = await submitControlledEvaluation(props.category, props.scene, props.variant, session.token, { scenarioKey: workbench.value?.defaultScenarioKey ?? "", decisions: decisions.value }); result.value = response.result; actionMessage.value = response.result.message; await recordResult(response.result); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : "固定评估失败"; }
  finally { isSubmitting.value = false; }
}
watch(() => [props.category, props.scene, props.variant], () => void loadWorkbench(), { immediate: true });
</script>

<template>
  <section class="page-section two-column controlled-decision-page">
    <header class="section-heading">
      <p class="eyebrow">{{ props.category }} / {{ props.scene }}</p>
      <h1>{{ pageTitle }}</h1>
      <p>{{ workbench?.summary ?? "固定受控决策实验" }}</p>
      <div class="variant-switch">
        <RouterLink :to="`/labs/${props.category}/${props.scene}/vuln`">风险观察版</RouterLink>
        <RouterLink :to="`/labs/${props.category}/${props.scene}/fixed`">防御复盘版</RouterLink>
      </div>
      <RouterLink class="text-link" :to="`/labs/${props.category}/${props.scene}`">返回实验详情</RouterLink>
    </header>
    <div class="controlled-decision-workbench">
      <p v-if="isLoading" class="state-text">正在加载固定工作台...</p>
      <template v-else-if="workbench && activeCase">
        <form class="form-panel" @submit.prevent="submitEvaluation">
          <p class="form-hint">页面只接受固定 scenarioKey 和决策 optionKey，不提供自由正文或真实目标输入。</p>
          <fieldset v-for="(step, index) in orderedSteps" :key="step.key" class="decision-step">
            <legend>{{ step.order }}. {{ step.title }}</legend>
            <p class="form-hint">{{ step.prompt }}</p>
            <div class="decision-options">
              <button v-for="option in step.options" :key="option.key" type="button" class="secondary-button" :class="{ 'option-active': optionSelectedAt(index) === option.key }" :aria-pressed="optionSelectedAt(index) === option.key" @click="chooseOption(index, option.key)">
                {{ option.label }}
              </button>
            </div>
          </fieldset>
          <div class="form-actions">
            <button type="button" class="secondary-button" @click="applyRecommendedPath">载入推荐路径</button>
            <button v-if="props.variant === 'fixed'" type="button" class="secondary-button" @click="applyNormalPath">{{ config.normalButton }}</button>
            <button type="submit" :disabled="isSubmitting">{{ isSubmitting ? "处理中..." : config.runButton }}</button>
          </div>
        </form>
        <section class="controlled-decision-status-panel" aria-label="固定决策状态" aria-live="polite">
          <div class="status-strip">
            <div><span>服务端决策</span><strong>{{ result?.decision ?? "pending" }}</strong></div>
            <div><span>学习信号</span><strong>{{ signalText }}</strong></div>
          </div>
          <dl class="inspection-grid">
            <div><dt>固定案例</dt><dd>{{ workbench.defaultScenarioKey }}</dd></div>
            <div><dt>决策步数</dt><dd>{{ result?.assessment.stepCount ?? orderedSteps.length }}</dd></div>
            <div><dt>风险结果数</dt><dd>{{ result?.recap.outcomeCounts.risk ?? 0 }}</dd></div>
            <div><dt>防御结果数</dt><dd>{{ result?.recap.outcomeCounts.fix ?? 0 }}</dd></div>
            <div><dt>正常结果数</dt><dd>{{ result?.recap.outcomeCounts.normal ?? 0 }}</dd></div>
          </dl>
          <ol v-if="result" class="record-list">
            <li v-for="step in result.steps" :key="step.stepKey"><strong>{{ formatControlledSignal(step.signal, config) }}</strong><span>{{ step.decision }} / {{ step.outcome }}</span><small>{{ step.explanation }}</small></li>
          </ol>
          <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
          <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
          <p v-if="!session.token" class="state-text">登录后可运行固定评估，并将安全摘要写入实验事件日志。</p>
        </section>
        <section class="form-panel" aria-label="固定证据线索"><h2>固定证据线索</h2><ul class="record-list"><li v-for="item in activeCase.evidence" :key="item.key"><strong>{{ item.title }}</strong><span>{{ item.detail }}</span></li></ul></section>
        <section class="guided-boundaries" aria-label="实验安全边界"><h2>安全边界</h2><ul><li v-for="boundary in workbench.safeBoundaries" :key="boundary">{{ boundary }}</li></ul></section>
      </template>
      <p v-if="errorMessage && !workbench" class="error-text">{{ errorMessage }}</p>
    </div>
  </section>
</template>

<style scoped>
.controlled-decision-page,
.controlled-decision-workbench,
.controlled-decision-status-panel,
.guided-boundaries {
  display: grid;
  gap: 1rem;
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

.decision-options {
  display: grid;
  gap: 0.5rem;
}

.option-active {
  border-color: #67e8f9;
  color: #67e8f9;
  font-weight: 700;
}

.status-strip {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
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

.status-strip strong {
  overflow-wrap: anywhere;
}

.guided-boundaries {
  padding-top: 1rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
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
  line-height: 1.6;
}

.text-link {
  color: #67e8f9;
  font-weight: 700;
}

@media (max-width: 640px) {
  .status-strip {
    flex-direction: column;
  }
}
</style>
