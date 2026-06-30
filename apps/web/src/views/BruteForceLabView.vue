<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitBruteForceAttempt,
  type BruteForceResult,
} from "../api/brute-force-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackPasswordCandidatesSample,
  attackTargetUsernameSample,
  createBruteForceLearningProgress,
  createBruteForceVerificationRecord,
  formatBruteForceSignal,
  getBruteForceVariantConfig,
  normalPasswordCandidatesSample,
  normalTargetUsernameSample,
  type BruteForceVariantKey,
} from "../labs/brute-force";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: BruteForceVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getBruteForceVariantConfig(props.variant));
const targetUsernameText = ref(normalTargetUsernameSample);
const passwordCandidatesText = ref(normalPasswordCandidatesSample.join("\n"));
const result = ref<BruteForceResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const passwordCandidates = computed(() =>
  passwordCandidatesText.value
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .filter(Boolean),
);

const signalText = computed(() =>
  result.value
    ? formatBruteForceSignal(result.value.signal)
    : "尚未提交候选口令",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "目标存在",
      value: result.value.inspection.targetExists ? "是" : "否",
    },
    {
      label: "候选数量",
      value: String(result.value.inspection.candidateCount),
    },
    {
      label: "匹配尝试",
      value:
        result.value.inspection.matchedAttemptNumber === null
          ? "未匹配"
          : `第 ${result.value.inspection.matchedAttemptNumber} 次`,
    },
    {
      label: "匹配前失败",
      value: String(result.value.inspection.failedAttemptsBeforeMatch),
    },
    {
      label: "超过阈值",
      value: result.value.inspection.thresholdExceeded ? "是" : "否",
    },
    {
      label: "已应用节流",
      value: result.value.inspection.rateLimitApplied ? "是" : "否",
    },
  ];
});

const accountRows = computed(() => {
  if (!result.value?.teachingAccount) {
    return [];
  }

  return [
    {
      label: "账号",
      value: result.value.teachingAccount.username,
    },
    {
      label: "名称",
      value: result.value.teachingAccount.displayName,
    },
    {
      label: "访问摘要",
      value: result.value.teachingAccount.accessSummary,
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
      "brute-force",
      session.token,
      createBruteForceLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(bruteForceResult: BruteForceResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    bruteForceResult.signal === "brute-force-password-guessed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    bruteForceResult.signal === "brute-force-rate-limit-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "auth",
      "brute-force",
      session.token,
      createBruteForceVerificationRecord(config.value, bruteForceResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalLoginSample() {
  targetUsernameText.value = normalTargetUsernameSample;
  passwordCandidatesText.value = normalPasswordCandidatesSample.join("\n");
  result.value = null;
  actionMessage.value = "已填入正常单次教学登录样例";
  errorMessage.value = "";
}

function useAttackCandidateSample() {
  targetUsernameText.value = attackTargetUsernameSample;
  passwordCandidatesText.value = attackPasswordCandidatesSample.join("\n");
  result.value = null;
  actionMessage.value = "已填入受控连续候选口令样例";
  errorMessage.value = "";
}

async function submitCandidates() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行暴力破解实验";
    return;
  }

  const normalizedTargetUsername = targetUsernameText.value.trim();
  const normalizedCandidates = passwordCandidates.value;

  if (!normalizedTargetUsername || normalizedCandidates.length < 1) {
    errorMessage.value = "请填写目标用户名和至少 1 个候选口令";
    return;
  }

  if (normalizedCandidates.length > 5) {
    errorMessage.value = "候选口令最多 5 个，本实验不支持字典枚举";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitBruteForceAttempt(
      config.value.key,
      session.token,
      {
        targetUsername: normalizedTargetUsername,
        passwordCandidates: normalizedCandidates,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "暴力破解实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    targetUsernameText.value = normalTargetUsernameSample;
    passwordCandidatesText.value = normalPasswordCandidatesSample.join("\n");
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
      <p class="eyebrow">auth / brute force</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/auth/brute-force/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/auth/brute-force/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="brute-force-workbench">
      <form class="form-panel" @submit.prevent="submitCandidates">
        <label>
          <span>目标教学用户名</span>
          <input v-model="targetUsernameText" aria-label="目标教学用户名" />
        </label>
        <label>
          <span>候选口令，每行一个，最多 5 个</span>
          <textarea
            v-model="passwordCandidatesText"
            rows="5"
            aria-label="候选口令列表"
          />
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="useNormalLoginSample"
          >
            正常单次登录
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useAttackCandidateSample"
          >
            连续猜测样例
          </button>
          <button type="submit" :disabled="isLoading">提交候选口令</button>
        </div>
      </form>

      <section class="brute-force-status-panel" aria-label="暴力破解实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>当前候选数</span>
          <strong>{{ passwordCandidates.length }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.teachingAccount" class="document-preview">
          <span
            :class="result.inspection.attackPattern ? 'danger-pill' : 'status-pill'"
          >
            {{ result.inspection.attackPattern ? "连续猜测命中" : "正常登录" }}
          </span>
          <h2>虚拟账号访问摘要</h2>
          <dl class="inspection-grid">
            <div v-for="row in accountRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </article>

        <article
          v-else-if="result?.inspection.rateLimitApplied"
          class="document-preview"
        >
          <span class="danger-pill">已节流</span>
          <h2>失败阈值判定</h2>
          <p>
            已有 {{ result.inspection.failedAttemptsBeforeMatch }} 次连续失败，
            阈值为 {{ result.inspection.lockoutThreshold }}，修复版停止继续检查后续候选口令。
          </p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控暴力破解实验请求，并把候选数量、失败阈值和学习信号写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
