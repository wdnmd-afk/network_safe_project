<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitSpearPhishingReview,
  type SpearPhishingCaseKey,
  type SpearPhishingResult,
  type SpearPhishingVerificationPolicyKey,
} from "../api/spear-phishing-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createSpearPhishingLearningProgress,
  createSpearPhishingVerificationRecord,
  defaultSpearPhishingCaseKey,
  formatSpearPhishingSignal,
  getDefaultSpearPhishingVerificationPolicyKey,
  getSpearPhishingCaseObservationRows,
  getSpearPhishingVariantConfig,
  spearPhishingCaseOptions,
  spearPhishingReviewChecklist,
  spearPhishingVerificationPolicyOptions,
  type SpearPhishingVariantKey,
} from "../labs/spear-phishing";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: SpearPhishingVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getSpearPhishingVariantConfig(props.variant));
const caseRows = computed(() =>
  getSpearPhishingCaseObservationRows(config.value.key),
);
const caseKey = ref<SpearPhishingCaseKey>(defaultSpearPhishingCaseKey);
const verificationPolicyKey = ref<SpearPhishingVerificationPolicyKey>(
  getDefaultSpearPhishingVerificationPolicyKey(props.variant),
);
const result = ref<SpearPhishingResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatSpearPhishingSignal(result.value.signal)
    : "尚未观察固定线索卡",
);

const selectedCase = computed(() =>
  spearPhishingCaseOptions.find((item) => item.key === caseKey.value),
);

const selectedPolicy = computed(() =>
  spearPhishingVerificationPolicyOptions.find(
    (item) => item.key === verificationPolicyKey.value,
  ),
);

const assessmentRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "风险等级",
      value: result.value.assessment.riskLevel,
    },
    {
      label: "风险线索数",
      value: String(result.value.assessment.riskIndicatorCount),
    },
    {
      label: "风险标签",
      value:
        result.value.assessment.riskIndicators.length > 0
          ? result.value.assessment.riskIndicators.join(", ")
          : "none",
    },
    {
      label: "命中固定案例",
      value: result.value.assessment.matchedControlledCase ? "是" : "否",
    },
    {
      label: "上下文偏置信任",
      value: result.value.assessment.contextTrustBias ? "是" : "否",
    },
    {
      label: "核验策略",
      value: result.value.assessment.verificationApplied ? "已应用" : "未应用",
    },
    {
      label: "审批链复核",
      value: result.value.assessment.approvalChainRequired ? "需要" : "未要求",
    },
    {
      label: "可信通道",
      value: result.value.assessment.outOfBandRequired ? "需要" : "未要求",
    },
    {
      label: "建议动作",
      value: result.value.assessment.recommendedAction,
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "案例来源",
    value: "固定虚构线索卡",
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
      "spear-phishing",
      session.token,
      createSpearPhishingLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(reviewResult: SpearPhishingResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (reviewResult.signal === "spear-phishing-context-trust-overweighted" ||
      reviewResult.signal === "spear-phishing-approval-chain-bypassed" ||
      reviewResult.signal === "spear-phishing-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (reviewResult.signal ===
      "spear-phishing-out-of-band-confirmation-required" ||
      reviewResult.signal === "spear-phishing-boundary-verified");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "social",
      "spear-phishing",
      session.token,
      createSpearPhishingVerificationRecord(config.value, reviewResult),
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

function chooseCase(nextCaseKey: SpearPhishingCaseKey) {
  const nextCase = spearPhishingCaseOptions.find(
    (item) => item.key === nextCaseKey,
  );

  caseKey.value = nextCaseKey;
  verificationPolicyKey.value = getDefaultSpearPhishingVerificationPolicyKey(
    config.value.key,
  );
  resetResult(`已选择 ${nextCase?.title ?? nextCaseKey}`);
}

function chooseApprovalReview() {
  verificationPolicyKey.value = "approval-chain-review";
  resetResult("已切换到审批链复核策略");
}

function chooseVendorConfirmation() {
  caseKey.value = "vendor-payment-change";
  verificationPolicyKey.value = "out-of-band-confirmation";
  resetResult("已选择供应商付款变更和可信通道二次确认样例");
}

function chooseEngineeringLeastPrivilege() {
  caseKey.value = "engineering-access-request";
  verificationPolicyKey.value = "least-privilege-review";
  resetResult("已选择工程临时访问和最小授权复核样例");
}

function chooseHrReportAndIsolate() {
  caseKey.value = "hr-benefit-personalized";
  verificationPolicyKey.value = "report-and-isolate";
  resetResult("已选择人事福利个性化和隔离举报复盘样例");
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行鱼叉式钓鱼固定案例观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitSpearPhishingReview(
      config.value.key,
      session.token,
      {
        caseKey: caseKey.value,
        verificationPolicyKey: verificationPolicyKey.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "鱼叉式钓鱼实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    caseKey.value = defaultSpearPhishingCaseKey;
    verificationPolicyKey.value = getDefaultSpearPhishingVerificationPolicyKey(
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
      <p class="eyebrow">social / spear-phishing</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/social/spear-phishing/vuln">
          针对性误判观察版
        </RouterLink>
        <RouterLink to="/labs/social/spear-phishing/fixed">
          流程核验复盘版
        </RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="spear-phishing-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定线索卡</span>
          <select v-model="caseKey" aria-label="鱼叉式钓鱼固定线索卡">
            <option
              v-for="caseOption in spearPhishingCaseOptions"
              :key="caseOption.key"
              :value="caseOption.key"
            >
              {{ caseOption.title }}
            </option>
          </select>
        </label>
        <label>
          <span>核验策略</span>
          <select
            v-model="verificationPolicyKey"
            aria-label="鱼叉式钓鱼核验策略"
          >
            <option
              v-for="policy in spearPhishingVerificationPolicyOptions"
              :key="policy.key"
              :value="policy.key"
            >
              {{ policy.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseCase('executive-invoice-approval')"
          >
            付款审批
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseVendorConfirmation"
          >
            供应商变更
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseEngineeringLeastPrivilege"
          >
            工程访问
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseHrReportAndIsolate"
          >
            HR 福利
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseApprovalReview"
          >
            审批链复核
          </button>
          <button type="submit" :disabled="isLoading">观察核验结果</button>
        </div>
      </form>

      <section
        class="spear-phishing-status-panel"
        aria-label="鱼叉式钓鱼实验状态"
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
          <span>当前案例</span>
          <strong>{{ result?.caseSummary?.title ?? selectedCase?.title }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in assessmentRows" :key="row.label">
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
              result.assessment.riskLevel === 'high'
                ? 'danger-pill'
                : 'status-pill'
            "
          >
            {{ result.assessment.riskLevel }}
          </span>
          <h2>{{ result.caseSummary.title }}</h2>
          <p>
            {{ result.caseSummary.roleContext }} ·
            {{ result.caseSummary.processContext }}
          </p>
          <p>{{ result.caseSummary.learningNotes }}</p>
        </article>

        <p v-if="!result && selectedCase" class="state-text">
          {{ selectedCase.roleContext }} · {{ selectedCase.processContext }}
        </p>
        <p v-if="!result && selectedPolicy" class="state-text">
          {{ selectedPolicy.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交鱼叉式钓鱼固定案例观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="鱼叉式钓鱼固定线索卡观察">
        <h2>固定线索卡观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="caseOption in caseRows" :key="caseOption.key">
            <strong>{{ caseOption.title }}</strong>
            <span>{{ caseOption.roleContext }} · {{ caseOption.riskLevel }}</span>
            <small>{{ caseOption.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="鱼叉式钓鱼复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in spearPhishingReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
