<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitFileUpload,
  type FileUploadResult,
} from "../api/file-upload-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackFileUploadSample,
  createFileUploadLearningProgress,
  createFileUploadVerificationRecord,
  formatFileUploadSignal,
  getFileUploadVariantConfig,
  normalFileUploadSample,
  type FileUploadVariantKey,
} from "../labs/file-upload";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: FileUploadVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getFileUploadVariantConfig(props.variant));
const fileName = ref(normalFileUploadSample.fileName);
const contentType = ref(normalFileUploadSample.contentType);
const contentText = ref(normalFileUploadSample.contentText);
const result = ref<FileUploadResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatFileUploadSignal(result.value.signal) : "尚未提交上传",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "扩展名",
      value: result.value.inspection.extension || "none",
    },
    {
      label: "扩展名白名单",
      value: result.value.inspection.allowedExtension ? "通过" : "不通过",
    },
    {
      label: "MIME 白名单",
      value: result.value.inspection.allowedContentType ? "通过" : "不通过",
    },
    {
      label: "可执行内容特征",
      value: result.value.inspection.detectedExecutableContent ? "发现" : "未发现",
    },
    {
      label: "内容长度",
      value: `${result.value.inspection.contentLength} chars`,
    },
  ];
});

function fillSample(sample: {
  fileName: string;
  contentType: string;
  contentText: string;
}) {
  fileName.value = sample.fileName;
  contentType.value = sample.contentType;
  contentText.value = sample.contentText;
  result.value = null;
  errorMessage.value = "";
}

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "web",
      "file-upload",
      session.token,
      createFileUploadLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(uploadResult: FileUploadResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    uploadResult.signal === "file-upload-executable-stored";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    uploadResult.signal === "file-upload-validation-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "file-upload",
      session.token,
      createFileUploadVerificationRecord(config.value, uploadResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  fillSample(normalFileUploadSample);
  actionMessage.value = "已填入正常图片样例";
}

function useAttackSample() {
  fillSample(attackFileUploadSample);
  actionMessage.value = "已填入受控攻击样例";
}

async function submitUpload() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行文件上传实验";
    return;
  }

  const normalizedFileName = fileName.value.trim();
  const normalizedContentType = contentType.value.trim();

  if (!normalizedFileName || !normalizedContentType || !contentText.value) {
    errorMessage.value = "请填写文件名、MIME 和模拟内容";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitFileUpload(config.value.key, session.token, {
      fileName: normalizedFileName,
      contentType: normalizedContentType,
      contentText: contentText.value,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "文件上传实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    fillSample(normalFileUploadSample);
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
      <p class="eyebrow">web / file upload</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/file-upload/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/file-upload/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="file-upload-workbench">
      <form class="form-panel" @submit.prevent="submitUpload">
        <label>
          <span>文件名</span>
          <input v-model="fileName" type="text" aria-label="文件名" />
        </label>
        <label>
          <span>MIME 类型</span>
          <input v-model="contentType" type="text" aria-label="MIME 类型" />
        </label>
        <label>
          <span>模拟内容</span>
          <textarea
            v-model="contentText"
            rows="6"
            aria-label="模拟上传内容"
          />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常图片样例
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">提交上传</button>
        </div>
      </form>

      <section class="file-upload-status-panel" aria-label="文件上传实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>存储结果</span>
          <strong>{{ result?.storedAsset ? "simulated" : "not-stored" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <pre v-if="result?.storedAsset" class="query-preview">{{
          result.storedAsset.storagePath
        }}</pre>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控文件上传实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
