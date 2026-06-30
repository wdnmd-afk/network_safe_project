<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitNosqlInjectionSearch,
  type NosqlInjectionResult,
} from "../api/nosql-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackNosqlInjectionFilterText,
  createNosqlInjectionLearningProgress,
  createNosqlInjectionVerificationRecord,
  formatNosqlInjectionSignal,
  getNosqlInjectionVariantConfig,
  normalNosqlInjectionFilterText,
  normalNosqlInjectionKeyword,
  normalNosqlInjectionQueryMode,
  type NosqlInjectionVariantKey,
} from "../labs/nosql-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: NosqlInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getNosqlInjectionVariantConfig(props.variant));
const queryMode = ref(normalNosqlInjectionQueryMode);
const keyword = ref(normalNosqlInjectionKeyword);
const filterText = ref(normalNosqlInjectionFilterText);
const result = ref<NosqlInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatNosqlInjectionSignal(result.value.signal)
    : "尚未查询优惠券",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "查询模式",
      value: result.value.queryMode,
    },
    {
      label: "关键词长度",
      value: String(result.value.inspection.keywordLength),
    },
    {
      label: "筛选文本长度",
      value: String(result.value.inspection.filterTextLength),
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
      "nosql-injection",
      session.token,
      createNosqlInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: NosqlInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    runResult.signal === "nosql-injection-query-expanded";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (runResult.signal === "nosql-injection-operator-blocked" ||
      runResult.signal === "nosql-injection-schema-blocked");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "nosql-injection",
      session.token,
      createNosqlInjectionVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  queryMode.value = normalNosqlInjectionQueryMode;
  keyword.value = normalNosqlInjectionKeyword;
  filterText.value = normalNosqlInjectionFilterText;
  result.value = null;
  actionMessage.value = "已填入正常优惠券检索条件";
  errorMessage.value = "";
}

function useAttackSample() {
  queryMode.value = normalNosqlInjectionQueryMode;
  keyword.value = normalNosqlInjectionKeyword;
  filterText.value = attackNosqlInjectionFilterText;
  result.value = null;
  actionMessage.value = "已填入受控 NoSQL 操作符样例";
  errorMessage.value = "";
}

async function submitSearch() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 NoSQL 注入实验";
    return;
  }

  const normalizedQueryMode = queryMode.value.trim();
  const normalizedKeyword = keyword.value.trim();
  const normalizedFilterText = filterText.value.trim();

  if (!normalizedQueryMode || !normalizedKeyword) {
    errorMessage.value = "请选择查询模式并填写优惠券关键词";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitNosqlInjectionSearch(
      config.value.key,
      session.token,
      {
        queryMode: normalizedQueryMode,
        keyword: normalizedKeyword,
        filterText: normalizedFilterText,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "NoSQL 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    queryMode.value = normalNosqlInjectionQueryMode;
    keyword.value = normalNosqlInjectionKeyword;
    filterText.value = normalNosqlInjectionFilterText;
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
      <p class="eyebrow">web / nosql injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/nosql-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/nosql-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="nosql-injection-workbench">
      <form class="form-panel" @submit.prevent="submitSearch">
        <label>
          <span>查询模式</span>
          <select v-model="queryMode" aria-label="查询模式">
            <option value="coupon-search">优惠券文档检索</option>
          </select>
        </label>
        <label>
          <span>关键词</span>
          <input v-model="keyword" type="text" aria-label="优惠券关键词" />
        </label>
        <label>
          <span>教学筛选文本</span>
          <input v-model="filterText" type="text" aria-label="教学筛选文本" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常查询
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入受控样例
          </button>
          <button type="submit" :disabled="isLoading">查询优惠券</button>
        </div>
      </form>

      <section
        class="nosql-injection-status-panel"
        aria-label="NoSQL 注入实验状态"
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
            <strong>{{ document.title }}</strong>
            <span>{{ document.channel }}</span>
            <small>{{
              document.visibility === "hidden" ? "虚拟隐藏教学记录" : "公开优惠券"
            }}</small>
          </li>
        </ul>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 NoSQL 注入实验请求，并把关键判定写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
