<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { submitSsrfFetch, type SsrfResult } from "../api/ssrf-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackSsrfSample,
  createSsrfLearningProgress,
  createSsrfVerificationRecord,
  formatSsrfSignal,
  getSsrfVariantConfig,
  normalSsrfSample,
  type SsrfVariantKey,
} from "../labs/ssrf";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: SsrfVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getSsrfVariantConfig(props.variant));
const targetUrl = ref(normalSsrfSample);
const result = ref<SsrfResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatSsrfSignal(result.value.signal) : "尚未抓取资源",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "协议",
      value: result.value.inspection.protocol || "none",
    },
    {
      label: "目标主机",
      value: result.value.inspection.hostname || "none",
    },
    {
      label: "公开白名单",
      value: result.value.inspection.allowedPublicHost ? "通过" : "不通过",
    },
    {
      label: "内部 / 私有目标",
      value: result.value.inspection.privateTarget ? "是" : "否",
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
      "ssrf",
      session.token,
      createSsrfLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(fetchResult: SsrfResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    fetchResult.signal === "ssrf-internal-metadata-exposed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    fetchResult.signal === "ssrf-private-target-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "ssrf",
      session.token,
      createSsrfVerificationRecord(config.value, fetchResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  targetUrl.value = normalSsrfSample;
  result.value = null;
  actionMessage.value = "已填入公开白名单资源";
  errorMessage.value = "";
}

function useAttackSample() {
  targetUrl.value = attackSsrfSample;
  result.value = null;
  actionMessage.value = "已填入受控 SSRF 样例";
  errorMessage.value = "";
}

async function submitFetch() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 SSRF 实验";
    return;
  }

  const normalizedTargetUrl = targetUrl.value.trim();

  if (!normalizedTargetUrl) {
    errorMessage.value = "请填写要抓取的目标 URL";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitSsrfFetch(config.value.key, session.token, {
      targetUrl: normalizedTargetUrl,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "SSRF 实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    targetUrl.value = normalSsrfSample;
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
      <p class="eyebrow">web / ssrf</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/ssrf/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/ssrf/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="ssrf-workbench">
      <form class="form-panel" @submit.prevent="submitFetch">
        <label>
          <span>目标 URL</span>
          <input v-model="targetUrl" type="text" aria-label="目标 URL" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入公开资源
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">抓取资源</button>
        </div>
      </form>

      <section class="ssrf-status-panel" aria-label="SSRF 实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>资源分类</span>
          <strong>{{ result?.resource?.resourceType ?? "not-fetched" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.resource" class="document-preview">
          <span :class="result.resource.isSensitive ? 'danger-pill' : 'status-pill'">
            {{ result.resource.isSensitive ? "内部模拟资源" : "公开资源" }}
          </span>
          <h2>{{ result.resource.title }}</h2>
          <p>{{ result.resource.content }}</p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控 SSRF 实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
