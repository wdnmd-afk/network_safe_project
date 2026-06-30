<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { submitXxeImport, type XxeImportResult } from "../api/xxe-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackXxeVirtualEntitySample,
  createXxeLearningProgress,
  createXxeVerificationRecord,
  formatXxeSignal,
  getXxeVariantConfig,
  normalXxeImportKind,
  normalXxeInvoiceSample,
  type XxeVariantKey,
} from "../labs/xxe";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: XxeVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getXxeVariantConfig(props.variant));
const importKind = ref(normalXxeImportKind);
const xmlDocument = ref(normalXxeInvoiceSample);
const result = ref<XxeImportResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatXxeSignal(result.value.signal) : "尚未导入 XML",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "XML 长度",
      value: String(result.value.inspection.xmlLength),
    },
    {
      label: "包含 DOCTYPE",
      value: result.value.inspection.containsDoctype ? "是" : "否",
    },
    {
      label: "声明实体",
      value: result.value.inspection.declaredEntityNames.join(", ") || "none",
    },
    {
      label: "引用实体",
      value: result.value.inspection.referencedEntityNames.join(", ") || "none",
    },
    {
      label: "实体来源",
      value: result.value.inspection.entitySourceTypes.join(", ") || "none",
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
      "xxe",
      session.token,
      createXxeLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: XxeImportResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (runResult.signal === "xxe-virtual-entity-resolved" ||
      runResult.signal === "xxe-internal-resource-exposed");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    runResult.signal === "xxe-doctype-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "xxe",
      session.token,
      createXxeVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  importKind.value = normalXxeImportKind;
  xmlDocument.value = normalXxeInvoiceSample;
  result.value = null;
  actionMessage.value = "已填入正常 XML 发票样例";
  errorMessage.value = "";
}

function useVirtualEntitySample() {
  importKind.value = normalXxeImportKind;
  xmlDocument.value = attackXxeVirtualEntitySample;
  result.value = null;
  actionMessage.value = "已填入受控 XXE 虚拟实体样例";
  errorMessage.value = "";
}

async function submitImport() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 XXE 实验";
    return;
  }

  const normalizedImportKind = importKind.value.trim();
  const normalizedXmlDocument = xmlDocument.value.trim();

  if (!normalizedImportKind || !normalizedXmlDocument) {
    errorMessage.value = "请选择导入类型并填写 XML 文档";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitXxeImport(config.value.key, session.token, {
      importKind: normalizedImportKind,
      xmlDocument: normalizedXmlDocument,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "XXE 实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    importKind.value = normalXxeImportKind;
    xmlDocument.value = normalXxeInvoiceSample;
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
      <p class="eyebrow">web / xxe</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/xxe/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/xxe/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="xxe-workbench">
      <form class="form-panel" @submit.prevent="submitImport">
        <label>
          <span>导入类型</span>
          <select v-model="importKind" aria-label="导入类型">
            <option value="invoice-preview">发票导入预览</option>
            <option value="config-preview">配置导入预览</option>
          </select>
        </label>
        <label>
          <span>XML 文档</span>
          <textarea v-model="xmlDocument" rows="8" aria-label="XML 文档" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常 XML
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useVirtualEntitySample"
          >
            填入受控 XXE 样例
          </button>
          <button type="submit" :disabled="isLoading">导入预览</button>
        </div>
      </form>

      <section class="xxe-status-panel" aria-label="XXE 实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>实体数量</span>
          <strong>{{
            result ? result.inspection.referencedEntityNames.length : 0
          }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <div v-if="result?.preview.fields.length" class="template-preview">
          <h2>{{ result.preview.title }}</h2>
          <p
            v-for="field in result.preview.fields"
            :key="field.key"
            :data-virtual-entity="field.fromVirtualEntity ? 'true' : undefined"
          >
            <strong>{{ field.label }}：</strong>{{ field.value }}
          </p>
        </div>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 XXE 实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
