<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitWhalingReview,
  type WhalingCaseKey,
  type WhalingResult,
  type WhalingVerificationPolicyKey,
} from "../api/whaling-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createWhalingLearningProgress,
  createWhalingVerificationRecord,
  defaultWhalingCaseKey,
  formatWhalingSignal,
  getDefaultWhalingVerificationPolicyKey,
  getWhalingCaseObservationRows,
  getWhalingVariantConfig,
  whalingCaseOptions,
  whalingReviewChecklist,
  whalingVerificationPolicyOptions,
  type WhalingVariantKey,
} from "../labs/whaling";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: WhalingVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getWhalingVariantConfig(props.variant));
const caseRows = computed(() => getWhalingCaseObservationRows(config.value.key));
const caseKey = ref<WhalingCaseKey>(defaultWhalingCaseKey);
const verificationPolicyKey = ref<WhalingVerificationPolicyKey>(
  getDefaultWhalingVerificationPolicyKey(props.variant),
);
const result = ref<WhalingResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatWhalingSignal(result.value.signal) : "尚未观察固定案例",
);

const selectedCase = computed(() =>
  whalingCaseOptions.find((item) => item.key === caseKey.value),
);

const selectedPolicy = computed(() =>
  whalingVerificationPolicyOptions.find(
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
      label: "权威上下文偏信",
      value: result.value.assessment.authorityContextBias ? "是" : "否",
    },
    {
      label: "核验策略",
      value: result.value.assessment.verificationApplied ? "已应用" : "未应用",
    },
    {
      label: "可信通道",
      value: result.value.assessment.trustedChannelRequired ? "需要" : "未要求",
    },
    {
      label: "付款冻结",
      value: result.value.assessment.paymentFreezeRequired ? "需要" : "未要求",
    },
    {
      label: "法务 / 董事会通道",
      value: result.value.assessment.legalBoardReviewRequired
        ? "需要"
        : "未要求",
    },
    {
      label: "最小授权",
      value: result.value.assessment.leastPrivilegeRequired ? "需要" : "未要求",
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
    value: "固定虚构高层决策案例",
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
      "whaling",
      session.token,
      createWhalingLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(reviewResult: WhalingResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (reviewResult.signal === "whaling-executive-authority-overweighted" ||
      reviewResult.signal === "whaling-confidential-pressure-identified" ||
      reviewResult.signal === "whaling-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (reviewResult.signal === "whaling-payment-freeze-required" ||
      reviewResult.signal === "whaling-boundary-verified");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "social",
      "whaling",
      session.token,
      createWhalingVerificationRecord(config.value, reviewResult),
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

function chooseCase(nextCaseKey: WhalingCaseKey) {
  const nextCase = whalingCaseOptions.find((item) => item.key === nextCaseKey);

  caseKey.value = nextCaseKey;
  verificationPolicyKey.value = getDefaultWhalingVerificationPolicyKey(
    config.value.key,
  );
  resetResult(`已选择 ${nextCase?.title ?? nextCaseKey}`);
}

function choosePaymentReview() {
  verificationPolicyKey.value = "payment-dual-approval";
  resetResult("已切换到大额付款双人复核策略");
}

function chooseBoardChannelReview() {
  caseKey.value = "board-confidential-request";
  verificationPolicyKey.value = "legal-board-channel-review";
  resetResult("已选择董事会保密事项和固定通道复核样例");
}

function chooseLegalSettlementReview() {
  caseKey.value = "legal-settlement-transfer";
  verificationPolicyKey.value = "freeze-and-escalate";
  resetResult("已选择法务结算付款和冻结升级复盘样例");
}

function chooseDataRoomLeastPrivilege() {
  caseKey.value = "ma-data-room-access";
  verificationPolicyKey.value = "least-privilege-data-room";
  resetResult("已选择并购资料室访问和最小授权复核样例");
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行捕鲸攻击固定案例观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitWhalingReview(config.value.key, session.token, {
      caseKey: caseKey.value,
      verificationPolicyKey: verificationPolicyKey.value,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "捕鲸攻击实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    caseKey.value = defaultWhalingCaseKey;
    verificationPolicyKey.value = getDefaultWhalingVerificationPolicyKey(
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
      <p class="eyebrow">social / whaling</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/social/whaling/vuln">
          高权威误判观察版
        </RouterLink>
        <RouterLink to="/labs/social/whaling/fixed">
          高风险流程核验复盘版
        </RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="whaling-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定高层决策案例</span>
          <select v-model="caseKey" aria-label="捕鲸攻击固定高层决策案例">
            <option
              v-for="caseOption in whalingCaseOptions"
              :key="caseOption.key"
              :value="caseOption.key"
            >
              {{ caseOption.title }}
            </option>
          </select>
        </label>
        <label>
          <span>核验策略</span>
          <select v-model="verificationPolicyKey" aria-label="捕鲸攻击核验策略">
            <option
              v-for="policy in whalingVerificationPolicyOptions"
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
            @click="chooseCase('executive-wire-approval')"
          >
            高层付款
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseBoardChannelReview"
          >
            董事会事项
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseLegalSettlementReview"
          >
            法务结算
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseDataRoomLeastPrivilege"
          >
            资料室访问
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="choosePaymentReview"
          >
            双人复核
          </button>
          <button type="submit" :disabled="isLoading">观察核验结果</button>
        </div>
      </form>

      <section class="whaling-status-panel" aria-label="捕鲸攻击实验状态">
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
              result.assessment.riskLevel === 'critical'
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
          登录后可提交捕鲸攻击固定案例观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="捕鲸攻击固定案例观察">
        <h2>固定案例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="caseOption in caseRows" :key="caseOption.key">
            <strong>{{ caseOption.title }}</strong>
            <span>{{ caseOption.roleContext }} · {{ caseOption.riskLevel }}</span>
            <small>{{ caseOption.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="捕鲸攻击复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in whalingReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
