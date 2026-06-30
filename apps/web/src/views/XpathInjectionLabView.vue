<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitXpathInjectionSearch,
  type XpathInjectionResult,
} from "../api/xpath-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackXpathKeyword,
  createXpathInjectionLearningProgress,
  createXpathInjectionVerificationRecord,
  formatXpathInjectionSignal,
  getXpathInjectionVariantConfig,
  normalXpathKeyword,
  normalXpathQueryTemplate,
  normalXpathScope,
  type XpathInjectionVariantKey,
} from "../labs/xpath-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: XpathInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getXpathInjectionVariantConfig(props.variant));
const queryTemplate = ref(normalXpathQueryTemplate);
const keyword = ref(normalXpathKeyword);
const scope = ref(normalXpathScope);
const result = ref<XpathInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatXpathInjectionSignal(result.value.signal)
    : "尚未查询产品目录",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "查询模板",
      value: result.value.queryTemplate,
    },
    {
      label: "查询范围",
      value: result.value.scope,
    },
    {
      label: "关键词长度",
      value: String(result.value.inspection.keywordLength),
    },
    {
      label: "关键词预览",
      value: result.value.inspection.keywordPreview,
    },
    {
      label: "风险类型",
      value: result.value.inspection.detectedRiskTypes.join(", "),
    },
    {
      label: "命中受控样例",
      value: result.value.inspection.matchedControlledSample ? "是" : "否",
    },
    {
      label: "结果范围",
      value: result.value.inspection.resultScope,
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
      "xpath-injection",
      session.token,
      createXpathInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: XpathInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    runResult.signal === "xpath-injection-result-scope-expanded";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    runResult.signal === "xpath-injection-controlled-sample-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "xpath-injection",
      session.token,
      createXpathInjectionVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  queryTemplate.value = normalXpathQueryTemplate;
  keyword.value = normalXpathKeyword;
  scope.value = normalXpathScope;
  result.value = null;
  actionMessage.value = "已填入正常产品目录查询条件";
  errorMessage.value = "";
}

function useAttackSample() {
  queryTemplate.value = normalXpathQueryTemplate;
  keyword.value = attackXpathKeyword;
  scope.value = normalXpathScope;
  result.value = null;
  actionMessage.value = "已填入受控 XPath 学习样例";
  errorMessage.value = "";
}

async function submitSearch() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 XPath 注入实验";
    return;
  }

  const normalizedQueryTemplate = queryTemplate.value.trim();
  const normalizedKeyword = keyword.value.trim();
  const normalizedScope = scope.value.trim();

  if (!normalizedQueryTemplate || !normalizedKeyword || !normalizedScope) {
    errorMessage.value = "请选择查询模板、查询范围并填写产品关键词";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitXpathInjectionSearch(
      config.value.key,
      session.token,
      {
        queryTemplate: normalizedQueryTemplate,
        keyword: normalizedKeyword,
        scope: normalizedScope,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "XPath 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    queryTemplate.value = normalXpathQueryTemplate;
    keyword.value = normalXpathKeyword;
    scope.value = normalXpathScope;
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
      <p class="eyebrow">web / xpath injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/xpath-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/xpath-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="xpath-injection-workbench">
      <form class="form-panel" @submit.prevent="submitSearch">
        <label>
          <span>查询模板</span>
          <select v-model="queryTemplate" aria-label="查询模板">
            <option value="product-catalog-by-name">产品目录关键词查询</option>
          </select>
        </label>
        <label>
          <span>查询范围</span>
          <select v-model="scope" aria-label="查询范围">
            <option value="public-catalog">公开产品目录</option>
          </select>
        </label>
        <label>
          <span>关键词</span>
          <input v-model="keyword" type="text" aria-label="产品关键词" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常查询
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入受控样例
          </button>
          <button type="submit" :disabled="isLoading">查询目录</button>
        </div>
      </form>

      <section
        class="xpath-injection-status-panel"
        aria-label="XPath 注入实验状态"
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
          <span>文档数量</span>
          <strong>{{ result ? result.documents.length : 0 }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <ul v-if="result" class="record-list">
          <li v-for="document in result.documents" :key="document.id">
            <strong>{{ document.name }}</strong>
            <span>{{ document.category }}</span>
            <small>{{
              document.visibility === "internal"
                ? "虚拟内部教学记录"
                : "公开产品"
            }}</small>
          </li>
        </ul>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 XPath 注入实验请求，并把关键判定写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
