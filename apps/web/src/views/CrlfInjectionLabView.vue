<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitCrlfInjectionPreview,
  type CrlfInjectionResult,
} from "../api/crlf-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackCrlfFileName,
  createCrlfInjectionLearningProgress,
  createCrlfInjectionVerificationRecord,
  formatCrlfInjectionSignal,
  getCrlfInjectionVariantConfig,
  normalCrlfDispositionType,
  normalCrlfFileName,
  normalCrlfHeaderTemplate,
  type CrlfInjectionVariantKey,
} from "../labs/crlf-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: CrlfInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getCrlfInjectionVariantConfig(props.variant));
const headerTemplate = ref(normalCrlfHeaderTemplate);
const dispositionType = ref(normalCrlfDispositionType);
const fileName = ref(normalCrlfFileName);
const result = ref<CrlfInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatCrlfInjectionSignal(result.value.signal)
    : "尚未生成响应头预览",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "响应头模板",
      value: result.value.headerTemplate,
    },
    {
      label: "下载方式",
      value: result.value.dispositionType,
    },
    {
      label: "文件名长度",
      value: String(result.value.inspection.fileNameLength),
    },
    {
      label: "脱敏预览",
      value: result.value.inspection.fileNamePreview,
    },
    {
      label: "控制字符",
      value:
        result.value.inspection.detectedControlChars.join(", ") || "none",
    },
    {
      label: "污染头部数",
      value: String(result.value.inspection.pollutedHeaderCount),
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
      "crlf-injection",
      session.token,
      createCrlfInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: CrlfInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    runResult.signal === "crlf-injection-virtual-header-injected";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    runResult.signal === "crlf-injection-control-chars-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "crlf-injection",
      session.token,
      createCrlfInjectionVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  headerTemplate.value = normalCrlfHeaderTemplate;
  dispositionType.value = normalCrlfDispositionType;
  fileName.value = normalCrlfFileName;
  result.value = null;
  actionMessage.value = "已填入正常下载文件名";
  errorMessage.value = "";
}

function useAttackSample() {
  headerTemplate.value = normalCrlfHeaderTemplate;
  dispositionType.value = normalCrlfDispositionType;
  fileName.value = attackCrlfFileName;
  result.value = null;
  actionMessage.value = "已填入受控 CRLF 样例";
  errorMessage.value = "";
}

async function submitPreview() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 CRLF 注入实验";
    return;
  }

  const normalizedHeaderTemplate = headerTemplate.value.trim();
  const normalizedDispositionType = dispositionType.value.trim();

  if (!normalizedHeaderTemplate || !normalizedDispositionType || !fileName.value) {
    errorMessage.value = "请选择模板、下载方式并填写文件名";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitCrlfInjectionPreview(
      config.value.key,
      session.token,
      {
        headerTemplate: normalizedHeaderTemplate,
        fileName: fileName.value,
        dispositionType: normalizedDispositionType,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "CRLF 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    headerTemplate.value = normalCrlfHeaderTemplate;
    dispositionType.value = normalCrlfDispositionType;
    fileName.value = normalCrlfFileName;
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
      <p class="eyebrow">web / crlf injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/crlf-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/crlf-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="crlf-injection-workbench">
      <form class="form-panel" @submit.prevent="submitPreview">
        <label>
          <span>响应头模板</span>
          <select v-model="headerTemplate" aria-label="响应头模板">
            <option value="download-filename">下载文件名响应头</option>
          </select>
        </label>
        <label>
          <span>下载方式</span>
          <select v-model="dispositionType" aria-label="下载方式">
            <option value="attachment">attachment</option>
            <option value="inline">inline</option>
          </select>
        </label>
        <label>
          <span>文件名文本</span>
          <textarea v-model="fileName" rows="4" aria-label="文件名文本"></textarea>
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常文件名
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入受控样例
          </button>
          <button type="submit" :disabled="isLoading">生成响应头预览</button>
        </div>
      </form>

      <section
        class="crlf-injection-status-panel"
        aria-label="CRLF 注入实验状态"
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
          <span>虚拟头部数</span>
          <strong>{{ result ? result.inspection.virtualHeaderCount : 0 }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <ul v-if="result" class="record-list">
          <li v-for="header in result.headers" :key="`${header.name}-${header.source}`">
            <strong>{{ header.name }}</strong>
            <span>{{ header.valuePreview }}</span>
            <small>{{ header.source }} / {{ header.polluted ? "polluted" : "clean" }}</small>
          </li>
        </ul>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 CRLF 注入实验请求，并把关键判定写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
