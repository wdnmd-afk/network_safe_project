<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitLdapInjectionSearch,
  type LdapInjectionResult,
  type LdapInjectionScenarioKey,
} from "../api/ldap-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackLdapInjectionKeyword,
  createLdapInjectionLearningProgress,
  createLdapInjectionVerificationRecord,
  formatLdapInjectionSignal,
  getLdapInjectionCaseStudyRows,
  getLdapInjectionVariantConfig,
  ldapInjectionReviewChecklist,
  ldapInjectionScenarioOptions,
  normalLdapInjectionKeyword,
  normalLdapInjectionScenarioKey,
  type LdapInjectionVariantKey,
} from "../labs/ldap-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: LdapInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getLdapInjectionVariantConfig(props.variant));
const caseStudyRows = computed(() =>
  getLdapInjectionCaseStudyRows(config.value.key),
);
const scenarioKey = ref<LdapInjectionScenarioKey>(
  normalLdapInjectionScenarioKey,
);
const keyword = ref(normalLdapInjectionKeyword);
const result = ref<LdapInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatLdapInjectionSignal(result.value.signal)
    : "尚未查询虚拟目录",
);

const statusRows = computed(() => [
  {
    label: "落地方式",
    value: "case-study + virtual-directory-api",
  },
  {
    label: "后端接口",
    value: "已接入受控虚拟目录",
  },
  {
    label: "脚本入口",
    value: "只读一致性验证",
  },
  {
    label: "事件日志",
    value: "写入统一实验事件日志",
  },
]);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "目录场景",
      value: result.value.scenarioKey,
    },
    {
      label: "场景允许",
      value: result.value.inspection.scenarioAllowed ? "是" : "否",
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
      "ldap-injection",
      session.token,
      createLdapInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: LdapInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    runResult.signal === "ldap-injection-scope-expanded";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (runResult.signal === "ldap-injection-controlled-sample-blocked" ||
      runResult.signal === "ldap-injection-input-blocked");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "ldap-injection",
      session.token,
      createLdapInjectionVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  scenarioKey.value = normalLdapInjectionScenarioKey;
  keyword.value = normalLdapInjectionKeyword;
  result.value = null;
  actionMessage.value = "已填入正常组织成员搜索条件";
  errorMessage.value = "";
}

function useControlledSample() {
  scenarioKey.value = normalLdapInjectionScenarioKey;
  keyword.value = attackLdapInjectionKeyword;
  result.value = null;
  actionMessage.value = "已填入受控 LDAP 学习样例";
  errorMessage.value = "";
}

async function submitSearch() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 LDAP 注入实验";
    return;
  }

  const normalizedScenarioKey = scenarioKey.value.trim();
  const normalizedKeyword = keyword.value.trim();

  if (!normalizedScenarioKey || !normalizedKeyword) {
    errorMessage.value = "请选择目录场景并填写关键词";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitLdapInjectionSearch(
      config.value.key,
      session.token,
      {
        scenarioKey: normalizedScenarioKey,
        keyword: normalizedKeyword,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "LDAP 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    scenarioKey.value = normalLdapInjectionScenarioKey;
    keyword.value = normalLdapInjectionKeyword;
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
      <p class="eyebrow">web / ldap injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/ldap-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/ldap-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="ldap-injection-workbench">
      <form class="form-panel" @submit.prevent="submitSearch">
        <label>
          <span>目录场景</span>
          <select v-model="scenarioKey" aria-label="目录场景">
            <option
              v-for="scenario in ldapInjectionScenarioOptions"
              :key="scenario.key"
              :value="scenario.key"
            >
              {{ scenario.title }}
            </option>
          </select>
        </label>
        <label>
          <span>关键词</span>
          <input v-model="keyword" type="text" aria-label="目录查询关键词" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常查询
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useControlledSample"
          >
            填入受控样例
          </button>
          <button type="submit" :disabled="isLoading">查询虚拟目录</button>
        </div>
      </form>

      <section
        class="ldap-injection-status-panel"
        aria-label="LDAP 注入实验状态"
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
          <span>目录条目</span>
          <strong>{{ result ? result.entries.length : 0 }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <dl v-else class="inspection-grid">
          <div v-for="row in statusRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <ul v-if="result" class="record-list">
          <li v-for="entry in result.entries" :key="entry.id">
            <strong>{{ entry.displayName }}</strong>
            <span>{{ entry.directoryArea }}</span>
            <small>{{
              entry.visibility === "restricted"
                ? "虚拟受限教学记录"
                : "公开目录记录"
            }}</small>
          </li>
        </ul>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 LDAP 注入实验请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="LDAP 注入案例观察">
        <h2>案例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="caseStudy in caseStudyRows" :key="caseStudy.key">
            <strong>{{ caseStudy.title }}</strong>
            <span>{{ caseStudy.businessGoal }}</span>
            <small>{{ caseStudy.focus }}</small>
            <small>{{ caseStudy.observation }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="LDAP 注入复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in ldapInjectionReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
