<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitPhishingReview,
  type PhishingCaseKey,
  type PhishingDefenseChecklistKey,
  type PhishingResult,
  type PhishingReviewModeKey,
} from "../api/phishing-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createPhishingLearningProgress,
  createPhishingVerificationRecord,
  defaultPhishingCaseKey,
  formatPhishingSignal,
  getDefaultPhishingDefenseChecklistKey,
  getDefaultPhishingReviewModeKey,
  getPhishingCaseObservationRows,
  getPhishingVariantConfig,
  phishingCaseOptions,
  phishingDefenseChecklistOptions,
  phishingReviewChecklist,
  phishingReviewModeOptions,
  type PhishingVariantKey,
} from "../labs/phishing";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PhishingVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPhishingVariantConfig(props.variant));
const caseRows = computed(() => getPhishingCaseObservationRows(config.value.key));
const caseKey = ref<PhishingCaseKey>(defaultPhishingCaseKey);
const reviewModeKey = ref<PhishingReviewModeKey>(
  getDefaultPhishingReviewModeKey(props.variant),
);
const defenseChecklistKey = ref<PhishingDefenseChecklistKey>(
  getDefaultPhishingDefenseChecklistKey(props.variant),
);
const result = ref<PhishingResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatPhishingSignal(result.value.signal)
    : "尚未观察固定线索卡",
);

const selectedCase = computed(() =>
  phishingCaseOptions.find((item) => item.key === caseKey.value),
);

const selectedReviewMode = computed(() =>
  phishingReviewModeOptions.find((item) => item.key === reviewModeKey.value),
);

const selectedChecklist = computed(() =>
  phishingDefenseChecklistOptions.find(
    (item) => item.key === defenseChecklistKey.value,
  ),
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "风险等级",
      value: result.value.inspection.riskLevel,
    },
    {
      label: "风险线索数",
      value: String(result.value.inspection.indicatorCount),
    },
    {
      label: "风险标签",
      value:
        result.value.inspection.riskIndicators.length > 0
          ? result.value.inspection.riskIndicators.join(", ")
          : "none",
    },
    {
      label: "命中固定案例",
      value: result.value.inspection.matchedControlledCase ? "是" : "否",
    },
    {
      label: "表面误判",
      value: result.value.inspection.surfaceBias ? "是" : "否",
    },
    {
      label: "检查清单",
      value: result.value.inspection.checklistApplied ? "已应用" : "未应用",
    },
    {
      label: "建议动作",
      value: result.value.inspection.recommendedAction,
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "案例来源",
    value: "固定线索卡",
  },
  {
    label: "观察方式",
    value: "固定选择器",
  },
  {
    label: "后端接口",
    value: "已接入受控 review API",
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
      "social",
      "phishing",
      session.token,
      createPhishingLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(reviewResult: PhishingResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (reviewResult.signal === "phishing-lookalike-domain-overlooked" ||
      reviewResult.signal === "phishing-credential-request-visible" ||
      reviewResult.signal === "phishing-attachment-risk-visible" ||
      reviewResult.signal === "phishing-case-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (reviewResult.signal === "phishing-reporting-flow-applied" ||
      reviewResult.signal === "phishing-safe-message-accepted" ||
      reviewResult.signal === "phishing-case-boundary-verified");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "social",
      "phishing",
      session.token,
      createPhishingVerificationRecord(config.value, reviewResult),
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

function chooseCase(nextCaseKey: PhishingCaseKey) {
  const nextCase = phishingCaseOptions.find((item) => item.key === nextCaseKey);

  caseKey.value = nextCaseKey;
  reviewModeKey.value = getDefaultPhishingReviewModeKey(config.value.key);
  defenseChecklistKey.value = getDefaultPhishingDefenseChecklistKey(
    config.value.key,
  );
  resetResult(`已选择 ${nextCase?.title ?? nextCaseKey}`);
}

function chooseSafeNewsletter() {
  caseKey.value = "internal-security-newsletter";
  reviewModeKey.value = "indicator-review";
  defenseChecklistKey.value = "safe-release-check";
  resetResult("已选择内部安全周报安全放行样例");
}

function chooseReportingFlow() {
  reviewModeKey.value = "reporting-flow";
  defenseChecklistKey.value = "report-isolate-confirm";
  resetResult("已切换到举报、隔离和二次确认流程");
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行网络钓鱼识别固定案例观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitPhishingReview(
      config.value.key,
      session.token,
      {
        caseKey: caseKey.value,
        reviewModeKey: reviewModeKey.value,
        defenseChecklistKey: defenseChecklistKey.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "网络钓鱼识别实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    caseKey.value = defaultPhishingCaseKey;
    reviewModeKey.value = getDefaultPhishingReviewModeKey(config.value.key);
    defenseChecklistKey.value = getDefaultPhishingDefenseChecklistKey(
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
      <p class="eyebrow">social / phishing</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/social/phishing/vuln">误判观察版</RouterLink>
        <RouterLink to="/labs/social/phishing/fixed">识别复盘版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="phishing-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定线索卡</span>
          <select v-model="caseKey" aria-label="网络钓鱼固定线索卡">
            <option
              v-for="caseOption in phishingCaseOptions"
              :key="caseOption.key"
              :value="caseOption.key"
            >
              {{ caseOption.title }}
            </option>
          </select>
        </label>
        <label>
          <span>观察模式</span>
          <select v-model="reviewModeKey" aria-label="网络钓鱼观察模式">
            <option
              v-for="mode in phishingReviewModeOptions"
              :key="mode.key"
              :value="mode.key"
            >
              {{ mode.title }}
            </option>
          </select>
        </label>
        <label>
          <span>检查清单</span>
          <select v-model="defenseChecklistKey" aria-label="网络钓鱼检查清单">
            <option
              v-for="checklist in phishingDefenseChecklistOptions"
              :key="checklist.key"
              :value="checklist.key"
            >
              {{ checklist.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseCase('invoice-urgent-review')"
          >
            发票复核
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseCase('account-security-alert')"
          >
            账号安全
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseCase('hr-benefit-update')"
          >
            人事福利
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseSafeNewsletter"
          >
            安全周报
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseReportingFlow"
          >
            举报隔离
          </button>
          <button type="submit" :disabled="isLoading">观察识别结果</button>
        </div>
      </form>

      <section class="phishing-status-panel" aria-label="网络钓鱼识别实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>当前案例</span>
          <strong>{{ result?.caseSummary?.title ?? selectedCase?.title }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
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

        <article v-if="result?.caseSummary" class="document-preview">
          <span
            :class="
              result.inspection.riskLevel === 'high'
                ? 'danger-pill'
                : 'status-pill'
            "
          >
            {{ result.inspection.riskLevel }}
          </span>
          <h2>{{ result.caseSummary.title }}</h2>
          <p>
            {{ result.caseSummary.surfaceCue }} ·
            {{ result.caseSummary.businessContext }}
          </p>
          <p>{{ result.caseSummary.learningNotes }}</p>
        </article>

        <p v-if="!result && selectedCase" class="state-text">
          {{ selectedCase.surfaceCue }} · {{ selectedCase.businessContext }}
        </p>
        <p v-if="!result && selectedReviewMode" class="state-text">
          {{ selectedReviewMode.description }}
        </p>
        <p v-if="!result && selectedChecklist" class="state-text">
          {{ selectedChecklist.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交网络钓鱼固定案例观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="网络钓鱼固定线索卡观察">
        <h2>固定线索卡观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="caseOption in caseRows" :key="caseOption.key">
            <strong>{{ caseOption.title }}</strong>
            <span>{{ caseOption.surfaceCue }} · {{ caseOption.riskLevel }}</span>
            <small>{{ caseOption.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="网络钓鱼复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in phishingReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
