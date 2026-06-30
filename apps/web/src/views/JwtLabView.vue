<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { submitJwtVerify, type JwtResult } from "../api/jwt-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackJwtSample,
  createJwtLearningProgress,
  createJwtVerificationRecord,
  formatJwtSignal,
  getJwtVariantConfig,
  normalJwtSample,
  type JwtVariantKey,
} from "../labs/jwt";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: JwtVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getJwtVariantConfig(props.variant));
const tokenText = ref(normalJwtSample);
const result = ref<JwtResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatJwtSignal(result.value.signal) : "尚未验证 token",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "段数",
      value: String(result.value.inspection.segmentCount),
    },
    {
      label: "算法",
      value: result.value.inspection.algorithm || "none",
    },
    {
      label: "签名存在",
      value: result.value.inspection.signaturePresent ? "是" : "否",
    },
    {
      label: "签名有效",
      value: result.value.inspection.signatureValid ? "是" : "否",
    },
  ];
});

const claimRows = computed(() => {
  if (!result.value?.payload) {
    return [];
  }

  return [
    {
      label: "sub",
      value: result.value.payload.sub,
    },
    {
      label: "role",
      value: result.value.payload.role,
    },
    {
      label: "scope",
      value: result.value.payload.scope,
    },
    {
      label: "lab",
      value: result.value.payload.lab,
    },
  ];
});

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "auth",
      "jwt",
      session.token,
      createJwtLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(jwtResult: JwtResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    jwtResult.signal === "jwt-none-alg-admin-accepted";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    jwtResult.signal === "jwt-none-alg-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "auth",
      "jwt",
      session.token,
      createJwtVerificationRecord(config.value, jwtResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  tokenText.value = normalJwtSample;
  result.value = null;
  actionMessage.value = "已填入正常签名教学 token";
  errorMessage.value = "";
}

function useAttackSample() {
  tokenText.value = attackJwtSample;
  result.value = null;
  actionMessage.value = "已填入 alg=none 管理员声明样例";
  errorMessage.value = "";
}

async function submitToken() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 JWT 实验";
    return;
  }

  const normalizedToken = tokenText.value.trim();

  if (!normalizedToken) {
    errorMessage.value = "请填写要验证的教学 token";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitJwtVerify(config.value.key, session.token, {
      token: normalizedToken,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "JWT 实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    tokenText.value = normalJwtSample;
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
      <p class="eyebrow">auth / jwt</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/auth/jwt/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/auth/jwt/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="jwt-workbench">
      <form class="form-panel" @submit.prevent="submitToken">
        <label>
          <span>教学 JWT</span>
          <textarea v-model="tokenText" rows="6" aria-label="教学 JWT" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入签名 token
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">验证 token</button>
        </div>
      </form>

      <section class="jwt-status-panel" aria-label="JWT 实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>授权资源</span>
          <strong>{{ result?.access?.resource ?? "not-granted" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.header || result?.payload" class="document-preview">
          <span
            :class="
              result.inspection.adminClaimRequested ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.inspection.adminClaimRequested ? "管理员声明" : "普通用户声明" }}
          </span>
          <h2>JWT 声明摘要</h2>
          <dl class="inspection-grid">
            <div v-if="result.header">
              <dt>alg</dt>
              <dd>{{ result.header.alg }}</dd>
            </div>
            <div v-if="result.header">
              <dt>typ</dt>
              <dd>{{ result.header.typ }}</dd>
            </div>
            <div v-for="row in claimRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </article>

        <article v-if="result?.access" class="document-preview">
          <h2>授权结果</h2>
          <p>
            {{ result.access.subject }} 以 {{ result.access.role }} 身份访问
            {{ result.access.resource }}，scope 为 {{ result.access.scope }}。
          </p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控 JWT 实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
