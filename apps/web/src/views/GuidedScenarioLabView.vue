<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchGuidedScenarioWorkbench,
  submitGuidedScenarioEvaluation,
  type GuidedScenarioResult,
  type GuidedScenarioVariantKey,
  type GuidedScenarioWorkbench,
} from "../api/guided-scenario-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  category: string;
  scene: string;
  variant: GuidedScenarioVariantKey;
}>();

const session = useSessionStore();
const workbench = ref<GuidedScenarioWorkbench | null>(null);
const scenarioKey = ref("");
const controlKey = ref("");
const result = ref<GuidedScenarioResult | null>(null);
const isLoadingConfig = ref(false);
const isSubmitting = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const variantTitle = computed(() =>
  props.variant === "vuln" ? "风险观察版" : "防御复盘版",
);
const variantExplanation = computed(() =>
  props.variant === "vuln"
    ? "观察固定高风险案例为何被接受，再切换到修复版对比控制策略。"
    : "验证高风险动作被阻断，同时确认完成控制后的正常流程仍可继续。",
);
const vulnerablePath = computed(
  () => `/labs/${props.category}/${props.scene}/vuln`,
);
const fixedPath = computed(
  () => `/labs/${props.category}/${props.scene}/fixed`,
);
const detailPath = computed(() => `/labs/${props.category}/${props.scene}`);
const selectedScenario = computed(() =>
  workbench.value?.scenarios.find((item) => item.key === scenarioKey.value),
);
const selectedControl = computed(() =>
  workbench.value?.controls.find((item) => item.key === controlKey.value),
);
const signalText = computed(() => result.value?.signal ?? "尚未运行固定评估");
const assessmentRows = computed(() => {
  if (!result.value) {
    return [
      { label: "案例来源", value: "共享固定场景目录" },
      { label: "输入方式", value: "固定 scenarioKey / controlKey" },
      { label: "事件日志", value: "只记录安全摘要" },
      { label: "外部连接", value: "禁止" },
    ];
  }

  return [
    { label: "风险等级", value: result.value.assessment.riskLevel },
    {
      label: "命中固定案例",
      value: result.value.assessment.matchedScenario ? "是" : "否",
    },
    {
      label: "命中控制策略",
      value: result.value.assessment.matchedControl ? "是" : "否",
    },
    {
      label: "控制已应用",
      value: result.value.assessment.controlApplied ? "是" : "否",
    },
    {
      label: "风险标签数",
      value: String(result.value.assessment.riskIndicatorCount),
    },
    {
      label: "风险标签",
      value: result.value.assessment.riskIndicators.join(", ") || "none",
    },
    { label: "固定案例", value: result.value.scenarioKey },
    { label: "控制策略", value: result.value.controlKey },
  ];
});

async function recordProgress() {
  if (!session.token || !workbench.value) {
    return;
  }

  try {
    await recordLearningProgress(
      props.category,
      props.scene,
      session.token,
      {
        variantKey: props.variant,
        status: "in-progress",
        notes: `${workbench.value.id} guided workbench opened`,
      },
    );
  } catch {
    // 学习进度失败不阻断固定场景观察。
  }
}

async function recordVerification(resultValue: GuidedScenarioResult) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      props.category,
      props.scene,
      session.token,
      {
        variantKey: props.variant,
        result:
          resultValue.decision === "blocked" ? "blocked" : "passed",
        summary: `${resultValue.labKey}: ${resultValue.signal}`,
        details: {
          scenarioKey: resultValue.scenarioKey,
          controlKey: resultValue.controlKey,
          decision: resultValue.decision,
          signal: resultValue.signal,
          riskLevel: resultValue.assessment.riskLevel,
          riskIndicatorCount: resultValue.assessment.riskIndicatorCount,
        },
      },
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
    const response = await fetchGuidedScenarioWorkbench(
      props.category,
      props.scene,
    );

    workbench.value = response.workbench;
    scenarioKey.value = response.workbench.defaultScenarioKey;
    controlKey.value = response.workbench.defaultControlKey;
    await recordProgress();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "固定场景工作台加载失败";
  } finally {
    isLoadingConfig.value = false;
  }
}

function selectVerifiedControl() {
  const verifiedControl = workbench.value?.controls.find(
    (item) => item.fixedDecision === "accepted",
  );

  if (!verifiedControl) {
    return;
  }

  controlKey.value = verifiedControl.key;
  result.value = null;
  actionMessage.value = `已选择 ${verifiedControl.title}`;
  errorMessage.value = "";
}

async function submitEvaluation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再运行固定场景评估";
    return;
  }

  if (!scenarioKey.value || !controlKey.value) {
    errorMessage.value = "固定案例或控制策略尚未加载";
    return;
  }

  isSubmitting.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitGuidedScenarioEvaluation(
      props.category,
      props.scene,
      props.variant,
      session.token,
      {
        scenarioKey: scenarioKey.value,
        controlKey: controlKey.value,
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
  () => [props.category, props.scene, props.variant],
  () => {
    void loadWorkbench();
  },
  { immediate: true },
);
</script>

<template>
  <section class="page-section two-column guided-scenario-page">
    <div class="section-heading">
      <p class="eyebrow">{{ category }} / {{ scene }}</p>
      <h1>
        {{ workbench ? `${workbench.title}${variantTitle}` : "固定场景工作台" }}
      </h1>
      <p>{{ workbench?.summary ?? variantExplanation }}</p>

      <div class="variant-switch">
        <RouterLink :to="vulnerablePath">风险观察版</RouterLink>
        <RouterLink :to="fixedPath">防御复盘版</RouterLink>
      </div>

      <div v-if="workbench" class="lab-note">
        <strong>{{ workbench.mode }} · {{ workbench.severity }}</strong>
        <span>{{ variantExplanation }}</span>
      </div>

      <RouterLink class="text-link" :to="detailPath">返回实验详情</RouterLink>
    </div>

    <div class="guided-scenario-workbench">
      <p v-if="isLoadingConfig" class="state-text">正在加载固定场景...</p>

      <template v-else-if="workbench">
        <form class="form-panel" @submit.prevent="submitEvaluation">
          <label>
            <span>固定学习案例</span>
            <select v-model="scenarioKey" aria-label="固定学习案例">
              <option
                v-for="scenario in workbench.scenarios"
                :key="scenario.key"
                :value="scenario.key"
              >
                {{ scenario.title }}
              </option>
            </select>
          </label>

          <label>
            <span>固定控制策略</span>
            <select v-model="controlKey" aria-label="固定控制策略">
              <option
                v-for="control in workbench.controls"
                :key="control.key"
                :value="control.key"
              >
                {{ control.title }}
              </option>
            </select>
          </label>

          <div class="form-actions">
            <button
              type="button"
              class="secondary-button"
              @click="selectVerifiedControl"
            >
              选择已验证控制
            </button>
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? "评估中..." : "运行固定评估" }}
            </button>
          </div>
        </form>

        <section
          class="guided-scenario-status-panel"
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
            <strong>{{ result?.scenarioTitle ?? selectedScenario?.title }}</strong>
          </div>

          <dl class="inspection-grid">
            <div v-for="row in assessmentRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>

          <div class="guided-context">
            <h2>{{ selectedScenario?.title }}</h2>
            <p>{{ selectedScenario?.description }}</p>
            <p>{{ selectedControl?.description }}</p>
          </div>

          <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
          <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
          <p v-if="!session.token" class="state-text">
            登录后可运行固定评估，并将安全摘要写入实验事件日志。
          </p>
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
.guided-scenario-page {
  align-items: start;
}

.guided-context,
.guided-boundaries {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid rgba(248, 250, 252, 0.1);
  padding-top: 0.9rem;
}

.guided-context h2,
.guided-context p,
.guided-boundaries h2,
.guided-boundaries ul {
  margin: 0;
}

.guided-context h2,
.guided-boundaries h2 {
  font-size: 1.05rem;
}

.guided-context p,
.guided-boundaries li {
  color: #cbd5e1;
  line-height: 1.65;
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
</style>
