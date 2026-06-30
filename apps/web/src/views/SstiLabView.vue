<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { submitSstiPreview, type SstiPreviewResult } from "../api/ssti-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackSstiDebugTemplateSample,
  attackSstiMathTemplateSample,
  createSstiLearningProgress,
  createSstiVerificationRecord,
  formatSstiSignal,
  getSstiVariantConfig,
  normalSstiTemplateKey,
  normalSstiTemplateSample,
  normalSstiVariables,
  type SstiVariantKey,
} from "../labs/ssti";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: SstiVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getSstiVariantConfig(props.variant));
const templateKey = ref(normalSstiTemplateKey);
const templateText = ref(normalSstiTemplateSample);
const customerName = ref(normalSstiVariables.customerName);
const orderNo = ref(normalSstiVariables.orderNo);
const noticeTitle = ref(normalSstiVariables.noticeTitle);
const result = ref<SstiPreviewResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatSstiSignal(result.value.signal) : "尚未预览通知",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "模板长度",
      value: String(result.value.inspection.templateLength),
    },
    {
      label: "表达式数量",
      value: String(result.value.inspection.expressionCount),
    },
    {
      label: "表达式类别",
      value: result.value.inspection.expressionTypes.join(", ") || "none",
    },
    {
      label: "命中受控样例",
      value: result.value.inspection.matchedControlledSample ? "是" : "否",
    },
  ];
});

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "web",
      "ssti",
      session.token,
      createSstiLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: SstiPreviewResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (runResult.signal === "ssti-expression-evaluated" ||
      runResult.signal === "ssti-template-context-exposed");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    runResult.signal === "ssti-expression-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "ssti",
      session.token,
      createSstiVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function resetVariables() {
  customerName.value = normalSstiVariables.customerName;
  orderNo.value = normalSstiVariables.orderNo;
  noticeTitle.value = normalSstiVariables.noticeTitle;
}

function useNormalSample() {
  templateKey.value = normalSstiTemplateKey;
  templateText.value = normalSstiTemplateSample;
  resetVariables();
  result.value = null;
  actionMessage.value = "已填入正常通知模板";
  errorMessage.value = "";
}

function useMathSample() {
  templateKey.value = normalSstiTemplateKey;
  templateText.value = attackSstiMathTemplateSample;
  resetVariables();
  result.value = null;
  actionMessage.value = "已填入受控表达式样例";
  errorMessage.value = "";
}

function useDebugSample() {
  templateKey.value = normalSstiTemplateKey;
  templateText.value = attackSstiDebugTemplateSample;
  resetVariables();
  result.value = null;
  actionMessage.value = "已填入受控上下文样例";
  errorMessage.value = "";
}

async function submitPreview() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 SSTI 实验";
    return;
  }

  const normalizedTemplateKey = templateKey.value.trim();
  const normalizedTemplateText = templateText.value.trim();
  const variables = {
    customerName: customerName.value.trim(),
    orderNo: orderNo.value.trim(),
    noticeTitle: noticeTitle.value.trim(),
  };

  if (
    !normalizedTemplateKey ||
    !normalizedTemplateText ||
    !variables.customerName ||
    !variables.orderNo ||
    !variables.noticeTitle
  ) {
    errorMessage.value = "请选择模板并填写客户名、订单号和通知标题";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitSstiPreview(config.value.key, session.token, {
      templateKey: normalizedTemplateKey,
      templateText: normalizedTemplateText,
      variables,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "SSTI 实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    templateKey.value = normalSstiTemplateKey;
    templateText.value = normalSstiTemplateSample;
    resetVariables();
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
      <p class="eyebrow">web / ssti</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/ssti/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/ssti/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="ssti-workbench">
      <form class="form-panel" @submit.prevent="submitPreview">
        <label>
          <span>通知模板</span>
          <select v-model="templateKey" aria-label="通知模板">
            <option value="shipping-notice">发货通知</option>
            <option value="security-reminder">安全提醒</option>
            <option value="invoice-ready">发票就绪提醒</option>
          </select>
        </label>
        <label>
          <span>模板文本</span>
          <textarea v-model="templateText" rows="5" aria-label="模板文本" />
        </label>
        <div class="form-grid">
          <label>
            <span>客户名</span>
            <input v-model="customerName" type="text" aria-label="客户名" />
          </label>
          <label>
            <span>订单号</span>
            <input v-model="orderNo" type="text" aria-label="订单号" />
          </label>
          <label>
            <span>通知标题</span>
            <input v-model="noticeTitle" type="text" aria-label="通知标题" />
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常模板
          </button>
          <button type="button" class="secondary-button" @click="useMathSample">
            填入表达式样例
          </button>
          <button type="button" class="secondary-button" @click="useDebugSample">
            填入上下文样例
          </button>
          <button type="submit" :disabled="isLoading">预览通知</button>
        </div>
      </form>

      <section class="ssti-status-panel" aria-label="SSTI 实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>表达式数量</span>
          <strong>{{ result ? result.inspection.expressionCount : 0 }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <div v-if="result?.renderedText" class="template-preview">
          <h2>通知预览</h2>
          <p>{{ result.renderedText }}</p>
        </div>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 SSTI 实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
