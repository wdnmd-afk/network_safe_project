<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitInfoDisclosureReport,
  type InfoDisclosureResult,
} from "../api/info-disclosure-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackInfoDisclosureSample,
  createInfoDisclosureLearningProgress,
  createInfoDisclosureVerificationRecord,
  formatInfoDisclosureSignal,
  getInfoDisclosureVariantConfig,
  normalInfoDisclosureSample,
  type InfoDisclosureVariantKey,
} from "../labs/info-disclosure";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: InfoDisclosureVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getInfoDisclosureVariantConfig(props.variant));
const reportKey = ref(normalInfoDisclosureSample);
const result = ref<InfoDisclosureResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatInfoDisclosureSignal(result.value.signal)
    : "尚未读取报告",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "规范化报告 key",
      value: result.value.inspection.normalizedReportKey || "none",
    },
    {
      label: "公开报告",
      value: result.value.inspection.allowedPublicReport ? "是" : "否",
    },
    {
      label: "敏感调试报告",
      value: result.value.inspection.requestedSensitiveReport ? "是" : "否",
    },
    {
      label: "返回字段数",
      value: String(result.value.inspection.exposedFieldCount),
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
      "info-disclosure",
      session.token,
      createInfoDisclosureLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(reportResult: InfoDisclosureResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    reportResult.signal === "info-disclosure-debug-data-exposed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    reportResult.signal === "info-disclosure-debug-data-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "info-disclosure",
      session.token,
      createInfoDisclosureVerificationRecord(config.value, reportResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  reportKey.value = normalInfoDisclosureSample;
  result.value = null;
  actionMessage.value = "已填入公开状态报告";
  errorMessage.value = "";
}

function useAttackSample() {
  reportKey.value = attackInfoDisclosureSample;
  result.value = null;
  actionMessage.value = "已填入调试报告攻击样例";
  errorMessage.value = "";
}

async function submitReport() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行信息泄露实验";
    return;
  }

  const normalizedReportKey = reportKey.value.trim();

  if (!normalizedReportKey) {
    errorMessage.value = "请填写要读取的报告 key";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitInfoDisclosureReport(
      config.value.key,
      session.token,
      {
        reportKey: normalizedReportKey,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "信息泄露实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    reportKey.value = normalInfoDisclosureSample;
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
      <p class="eyebrow">web / info disclosure</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/info-disclosure/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/info-disclosure/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="info-disclosure-workbench">
      <form class="form-panel" @submit.prevent="submitReport">
        <label>
          <span>报告 key</span>
          <input v-model="reportKey" type="text" aria-label="报告 key" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入公开报告
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">读取报告</button>
        </div>
      </form>

      <section
        class="info-disclosure-status-panel"
        aria-label="信息泄露实验状态"
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
          <span>报告类型</span>
          <strong>{{ result?.report?.reportType ?? "not-read" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.report" class="document-preview">
          <span :class="result.report.isSensitive ? 'danger-pill' : 'status-pill'">
            {{ result.report.isSensitive ? "调试报告" : "公开报告" }}
          </span>
          <h2>{{ result.report.title }}</h2>
          <p>{{ result.report.summary }}</p>
          <ul class="report-field-list">
            <li v-for="field in result.report.fields" :key="field.label">
              <strong>{{ field.label }}</strong>
              <span>{{ field.value }}</span>
            </li>
          </ul>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控信息泄露实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
