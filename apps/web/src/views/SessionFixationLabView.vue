<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitSessionFixationLogin,
  type SessionFixationResult,
} from "../api/session-fixation-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackPreLoginSessionIdSample,
  attackSessionSourceSample,
  createSessionFixationLearningProgress,
  createSessionFixationVerificationRecord,
  formatSessionFixationSignal,
  getSessionFixationVariantConfig,
  normalPreLoginSessionIdSample,
  normalSessionSourceSample,
  type SessionFixationVariantKey,
} from "../labs/session-fixation";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: SessionFixationVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getSessionFixationVariantConfig(props.variant));
const preLoginSessionIdText = ref(normalPreLoginSessionIdSample);
const sessionSourceText = ref(normalSessionSourceSample);
const result = ref<SessionFixationResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatSessionFixationSignal(result.value.signal)
    : "尚未提交教学登录",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "会话来源",
      value: result.value.inspection.sessionSource,
    },
    {
      label: "攻击者可控",
      value: result.value.inspection.attackerControlled ? "是" : "否",
    },
    {
      label: "接受客户端 ID",
      value: result.value.inspection.acceptedClientSessionId ? "是" : "否",
    },
    {
      label: "登录后轮换",
      value: result.value.inspection.rotatedSessionId ? "是" : "否",
    },
    {
      label: "会话 ID 已变化",
      value: result.value.inspection.sessionIdChanged ? "是" : "否",
    },
    {
      label: "当前用户",
      value: result.value.inspection.currentUserId,
    },
  ];
});

const sessionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "绑定用户",
      value: result.value.teachingSession.ownerUsername,
    },
    {
      label: "绑定来源",
      value: result.value.teachingSession.source,
    },
    {
      label: "教学会话 ID",
      value: result.value.teachingSession.sessionId,
    },
    {
      label: "ID 长度",
      value: String(result.value.inspection.boundSessionIdLength),
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
      "session-fixation",
      session.token,
      createSessionFixationLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(sessionResult: SessionFixationResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    sessionResult.signal === "session-fixed-id-bound";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    sessionResult.signal === "session-fixed-id-rotated";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "auth",
      "session-fixation",
      session.token,
      createSessionFixationVerificationRecord(config.value, sessionResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSessionSample() {
  preLoginSessionIdText.value = normalPreLoginSessionIdSample;
  sessionSourceText.value = normalSessionSourceSample;
  result.value = null;
  actionMessage.value = "已填入普通浏览器预登录会话样例";
  errorMessage.value = "";
}

function useFixedSessionSample() {
  preLoginSessionIdText.value = attackPreLoginSessionIdSample;
  sessionSourceText.value = attackSessionSourceSample;
  result.value = null;
  actionMessage.value = "已填入外部链接固定会话样例";
  errorMessage.value = "";
}

async function submitTeachingLogin() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行会话固定实验";
    return;
  }

  const normalizedSessionId = preLoginSessionIdText.value.trim();
  const normalizedSessionSource = sessionSourceText.value.trim();

  if (!normalizedSessionId || !normalizedSessionSource) {
    errorMessage.value = "请填写登录前教学会话 ID 和会话来源";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitSessionFixationLogin(
      config.value.key,
      session.token,
      {
        preLoginSessionId: normalizedSessionId,
        sessionSource: normalizedSessionSource,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "会话固定实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    preLoginSessionIdText.value = normalPreLoginSessionIdSample;
    sessionSourceText.value = normalSessionSourceSample;
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
      <p class="eyebrow">auth / session fixation</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/auth/session-fixation/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/auth/session-fixation/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="session-fixation-workbench">
      <form class="form-panel" @submit.prevent="submitTeachingLogin">
        <label>
          <span>登录前教学会话 ID</span>
          <input
            v-model="preLoginSessionIdText"
            aria-label="登录前教学会话 ID"
          />
        </label>
        <label>
          <span>会话来源</span>
          <select v-model="sessionSourceText" aria-label="会话来源">
            <option value="browser">browser</option>
            <option value="external-link">external-link</option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="useNormalSessionSample"
          >
            普通预登录 ID
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useFixedSessionSample"
          >
            外部链接固定 ID
          </button>
          <button type="submit" :disabled="isLoading">提交教学登录</button>
        </div>
      </form>

      <section
        class="session-fixation-status-panel"
        aria-label="会话固定实验状态"
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
          <span>绑定来源</span>
          <strong>{{ result?.teachingSession.source ?? "unknown" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result" class="document-preview">
          <span
            :class="
              result.inspection.attackerControlled ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.inspection.attackerControlled ? "外部链接来源" : "浏览器来源" }}
          </span>
          <h2>教学会话绑定摘要</h2>
          <dl class="inspection-grid">
            <div v-for="row in sessionRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <p>{{ result.teachingSession.accessSummary }}</p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控会话固定实验请求，并把会话来源、轮换结果和学习信号写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
