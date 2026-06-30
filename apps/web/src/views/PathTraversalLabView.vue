<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitPathTraversalRead,
  type PathTraversalResult,
} from "../api/path-traversal-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackPathTraversalSample,
  createPathTraversalLearningProgress,
  createPathTraversalVerificationRecord,
  formatPathTraversalSignal,
  getPathTraversalVariantConfig,
  normalPathTraversalSample,
  type PathTraversalVariantKey,
} from "../labs/path-traversal";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PathTraversalVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPathTraversalVariantConfig(props.variant));
const requestedPath = ref(normalPathTraversalSample);
const result = ref<PathTraversalResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatPathTraversalSignal(result.value.signal) : "尚未读取文档",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "允许根目录",
      value: result.value.inspection.allowedRoot,
    },
    {
      label: "规范化路径",
      value: result.value.inspection.normalizedPath || "none",
    },
    {
      label: "包含遍历段",
      value: result.value.inspection.containsTraversalSequence ? "是" : "否",
    },
    {
      label: "逃逸公开目录",
      value: result.value.inspection.escapedAllowedRoot ? "是" : "否",
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
      "path-traversal",
      session.token,
      createPathTraversalLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(readResult: PathTraversalResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    readResult.signal === "path-traversal-sensitive-file-exposed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    readResult.signal === "path-traversal-normalized-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "path-traversal",
      session.token,
      createPathTraversalVerificationRecord(config.value, readResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  requestedPath.value = normalPathTraversalSample;
  result.value = null;
  actionMessage.value = "已填入公开文档路径";
  errorMessage.value = "";
}

function useAttackSample() {
  requestedPath.value = attackPathTraversalSample;
  result.value = null;
  actionMessage.value = "已填入受控路径遍历样例";
  errorMessage.value = "";
}

async function submitRead() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行目录遍历实验";
    return;
  }

  const normalizedPath = requestedPath.value.trim();

  if (!normalizedPath) {
    errorMessage.value = "请填写要读取的虚拟文档路径";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitPathTraversalRead(
      config.value.key,
      session.token,
      {
        requestedPath: normalizedPath,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "目录遍历实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    requestedPath.value = normalPathTraversalSample;
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
      <p class="eyebrow">web / path traversal</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/path-traversal/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/path-traversal/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="path-traversal-workbench">
      <form class="form-panel" @submit.prevent="submitRead">
        <label>
          <span>虚拟文档路径</span>
          <input v-model="requestedPath" type="text" aria-label="虚拟文档路径" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入公开文档
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">读取文档</button>
        </div>
      </form>

      <section class="path-traversal-status-panel" aria-label="目录遍历实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>文档分类</span>
          <strong>{{ result?.document?.classification ?? "not-read" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.document" class="document-preview">
          <span :class="result.document.isSensitive ? 'danger-pill' : 'status-pill'">
            {{ result.document.isSensitive ? "内部模拟文档" : "公开文档" }}
          </span>
          <h2>{{ result.document.title }}</h2>
          <p>{{ result.document.content }}</p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控目录遍历实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
