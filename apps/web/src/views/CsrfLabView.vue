<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchCsrfState,
  issueCsrfToken,
  submitCsrfTransfer,
  type CsrfLabState,
} from "../api/csrf-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createCsrfLearningProgress,
  createCsrfVerificationRecord,
  csrfSampleTransfer,
  formatCsrfSignal,
  getCsrfVariantConfig,
  type CsrfVariantKey,
} from "../labs/csrf";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: CsrfVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getCsrfVariantConfig(props.variant));
const amount = ref(csrfSampleTransfer.amount);
const targetAccount = ref(csrfSampleTransfer.targetAccount);
const csrfToken = ref("");
const state = ref<CsrfLabState | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  state.value ? formatCsrfSignal(state.value.lastSignal) : "尚未读取实验状态",
);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "web",
      "csrf",
      session.token,
      createCsrfLearningProgress(config.value),
    );
  } catch {
    // 记录链路失败不阻断实验页面，避免本机数据库状态影响学习。
  }
}

async function recordVerification(signal: CsrfLabState["lastSignal"]) {
  if (!session.token) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "csrf",
      session.token,
      createCsrfVerificationRecord(config.value, signal),
    );
  } catch {
    // 验证记录是平台闭环辅助能力，失败后仍允许继续观察 CSRF 行为差异。
  }
}

async function loadState() {
  if (!session.token) {
    state.value = null;
    return;
  }

  const result = await fetchCsrfState(session.token);
  state.value = result.state;
}

async function prepareFixedToken() {
  if (!session.token || config.value.key !== "fixed") {
    csrfToken.value = "";
    return;
  }

  const result = await issueCsrfToken(session.token);
  csrfToken.value = result.csrfToken;
}

async function refreshLab() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 CSRF 实验";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await Promise.all([loadState(), prepareFixedToken()]);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "CSRF 实验状态加载失败";
  } finally {
    isLoading.value = false;
  }
}

async function submitNormalTransfer() {
  if (!session.token) {
    errorMessage.value = "请先登录后再提交转账";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const result = await submitCsrfTransfer(config.value.key, session.token, {
      amount: amount.value,
      targetAccount: targetAccount.value,
      csrfToken: config.value.key === "fixed" ? csrfToken.value : undefined,
    });
    state.value = result.state;
    actionMessage.value =
      result.status === "ok" ? "正常转账请求已提交" : "转账请求已被后端阻断";

    if (config.value.key === "fixed") {
      await prepareFixedToken();
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "正常转账请求失败";
  } finally {
    isLoading.value = false;
  }
}

async function simulateCrossSiteRequest() {
  if (!session.token) {
    errorMessage.value = "请先登录后再模拟第三方请求";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const result = await submitCsrfTransfer(config.value.key, session.token, {
      amount: amount.value,
      targetAccount: targetAccount.value,
    });
    state.value = result.state;
    actionMessage.value =
      result.status === "ok"
        ? "模拟第三方请求已被漏洞版接受"
        : "模拟第三方请求已被修复版阻断";

    if (
      result.state.lastSignal === "csrf-transfer-accepted" ||
      result.state.lastSignal === "csrf-token-required"
    ) {
      await recordVerification(result.state.lastSignal);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "模拟第三方请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    amount.value = csrfSampleTransfer.amount;
    targetAccount.value = csrfSampleTransfer.targetAccount;
    actionMessage.value = "";
    errorMessage.value = "";
    void recordProgress();
    void refreshLab();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <section class="page-section two-column">
    <div class="section-heading">
      <p class="eyebrow">web / csrf</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/csrf/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/csrf/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="csrf-workbench">
      <form class="form-panel" @submit.prevent="submitNormalTransfer">
        <label>
          <span>转账金额</span>
          <input v-model.number="amount" type="number" min="1" aria-label="转账金额" />
        </label>
        <label>
          <span>收款账号</span>
          <input v-model="targetAccount" type="text" aria-label="收款账号" />
        </label>
        <label v-if="config.key === 'fixed'">
          <span>CSRF token</span>
          <input v-model="csrfToken" type="text" aria-label="CSRF token" readonly />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="simulateCrossSiteRequest">
            模拟第三方请求
          </button>
          <button type="button" class="secondary-button" @click="refreshLab">
            刷新状态
          </button>
          <button type="submit" :disabled="isLoading">提交正常转账</button>
        </div>
      </form>

      <section class="csrf-status-panel" aria-label="CSRF 实验状态">
        <div class="status-metric">
          <span>账户余额</span>
          <strong>{{ state ? state.balance : "未登录" }}</strong>
        </div>
        <div class="status-metric">
          <span>业务状态</span>
          <strong>{{ state ? state.status : "unavailable" }}</strong>
        </div>
        <div class="status-metric">
          <span>验证信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <p v-if="state?.lastTransfer" class="state-text">
          最近转账：{{ state.lastTransfer.amount }} -> {{ state.lastTransfer.targetAccount }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可触发受控 CSRF 实验请求，并把验证结果写入账户中心。
        </p>
      </section>
    </div>
  </section>
</template>
