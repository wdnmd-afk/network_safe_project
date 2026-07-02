<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitDependencyConfusionResolution,
  type DependencyConfusionManifestKey,
  type DependencyConfusionRegistryScenarioKey,
  type DependencyConfusionResolutionPolicyKey,
  type DependencyConfusionResult,
} from "../api/dependency-confusion-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createDependencyConfusionLearningProgress,
  createDependencyConfusionVerificationRecord,
  dependencyConfusionManifestOptions,
  dependencyConfusionRegistryScenarioOptions,
  dependencyConfusionResolutionPolicyOptions,
  dependencyConfusionReviewChecklist,
  formatDependencyConfusionSignal,
  getDefaultDependencyConfusionManifestKey,
  getDefaultDependencyConfusionRegistryScenarioKey,
  getDefaultDependencyConfusionResolutionPolicyKey,
  getDependencyConfusionManifestObservationRows,
  getDependencyConfusionVariantConfig,
  type DependencyConfusionVariantKey,
} from "../labs/dependency-confusion";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: DependencyConfusionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getDependencyConfusionVariantConfig(props.variant));
const manifestRows = computed(() =>
  getDependencyConfusionManifestObservationRows(config.value.key),
);
const manifestKey = ref<DependencyConfusionManifestKey>(
  getDefaultDependencyConfusionManifestKey(props.variant),
);
const registryScenarioKey = ref<DependencyConfusionRegistryScenarioKey>(
  getDefaultDependencyConfusionRegistryScenarioKey(props.variant),
);
const resolutionPolicyKey = ref<DependencyConfusionResolutionPolicyKey>(
  getDefaultDependencyConfusionResolutionPolicyKey(props.variant),
);
const result = ref<DependencyConfusionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatDependencyConfusionSignal(result.value.signal)
    : "尚未观察固定解析样例",
);

const selectedManifest = computed(() =>
  dependencyConfusionManifestOptions.find(
    (manifest) => manifest.key === manifestKey.value,
  ),
);

const selectedRegistryScenario = computed(() =>
  dependencyConfusionRegistryScenarioOptions.find(
    (scenario) => scenario.key === registryScenarioKey.value,
  ),
);

const selectedResolutionPolicy = computed(() =>
  dependencyConfusionResolutionPolicyOptions.find(
    (policy) => policy.key === resolutionPolicyKey.value,
  ),
);

const resolutionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "解析来源",
      value: result.value.resolution.resolvedSource,
    },
    {
      label: "来源信任",
      value: result.value.resolution.sourceTrust,
    },
    {
      label: "scope 状态",
      value: result.value.resolution.packageScopeStatus,
    },
    {
      label: "lockfile 状态",
      value: result.value.resolution.lockfileStatus,
    },
    {
      label: "风险标签数",
      value: String(result.value.resolution.riskIndicatorCount),
    },
    {
      label: "风险标签",
      value:
        result.value.resolution.riskIndicators.length > 0
          ? result.value.resolution.riskIndicators.join(", ")
          : "none",
    },
    {
      label: "审计动作",
      value:
        result.value.resolution.auditActions.length > 0
          ? result.value.resolution.auditActions.join(", ")
          : "none",
    },
    {
      label: "建议动作",
      value: result.value.resolution.recommendedAction,
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "样例来源",
    value: "固定 manifest 摘要",
  },
  {
    label: "registry 场景",
    value: "固定伪元数据",
  },
  {
    label: "后端接口",
    value: "已接入受控 resolve API",
  },
  {
    label: "脚本入口",
    value: "只读验证脚本已登记",
  },
]);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "supply-chain",
      "dependency-confusion",
      session.token,
      createDependencyConfusionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(resolveResult: DependencyConfusionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (resolveResult.signal === "dependency-confusion-public-source-selected" ||
      resolveResult.signal === "dependency-confusion-private-scope-missing" ||
      resolveResult.signal === "dependency-confusion-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (resolveResult.signal === "dependency-confusion-private-scope-pinned" ||
      resolveResult.signal === "dependency-confusion-registry-source-audited" ||
      resolveResult.signal ===
        "dependency-confusion-lockfile-integrity-blocked" ||
      resolveResult.signal ===
        "dependency-confusion-safe-public-package-accepted" ||
      resolveResult.signal === "dependency-confusion-boundary-verified");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "supply-chain",
      "dependency-confusion",
      session.token,
      createDependencyConfusionVerificationRecord(
        config.value,
        resolveResult,
      ),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function resetResult(message: string) {
  result.value = null;
  actionMessage.value = message;
  errorMessage.value = "";
}

function chooseUnscopedCollision() {
  manifestKey.value = "unscoped-internal-name";
  registryScenarioKey.value = "public-name-collision";
  resolutionPolicyKey.value = "prefer-public-latest";
  resetResult("已选择未绑定 scope 和公共同名碰撞样例");
}

function choosePrivateScope() {
  manifestKey.value = "scoped-private-package";
  registryScenarioKey.value = "private-scope-pinned";
  resolutionPolicyKey.value = "scope-pinned-private";
  resetResult("已选择私有 scope 固定来源样例");
}

function chooseIntegrityAudit() {
  manifestKey.value = "mixed-source-review";
  registryScenarioKey.value = "lockfile-integrity-mismatch";
  resolutionPolicyKey.value = "lockfile-integrity-audit";
  resetResult("已选择 lockfile 完整性审计样例");
}

function chooseMixedSource() {
  manifestKey.value = "mixed-source-review";
  registryScenarioKey.value = "private-scope-pinned";
  resolutionPolicyKey.value = "scope-pinned-private";
  resetResult("已选择公开依赖与私有依赖混合审计样例");
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行依赖混淆固定解析观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitDependencyConfusionResolution(
      config.value.key,
      session.token,
      {
        manifestKey: manifestKey.value,
        registryScenarioKey: registryScenarioKey.value,
        resolutionPolicyKey: resolutionPolicyKey.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "依赖混淆实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    manifestKey.value = getDefaultDependencyConfusionManifestKey(
      config.value.key,
    );
    registryScenarioKey.value = getDefaultDependencyConfusionRegistryScenarioKey(
      config.value.key,
    );
    resolutionPolicyKey.value =
      getDefaultDependencyConfusionResolutionPolicyKey(config.value.key);
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
      <p class="eyebrow">supply chain / dependency confusion</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/supply-chain/dependency-confusion/vuln">
          解析风险观察版
        </RouterLink>
        <RouterLink to="/labs/supply-chain/dependency-confusion/fixed">
          来源审计复盘版
        </RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="dependency-confusion-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定 manifest 摘要</span>
          <select v-model="manifestKey" aria-label="依赖混淆固定 manifest 摘要">
            <option
              v-for="manifest in dependencyConfusionManifestOptions"
              :key="manifest.key"
              :value="manifest.key"
            >
              {{ manifest.title }}
            </option>
          </select>
        </label>
        <label>
          <span>伪 registry 场景</span>
          <select
            v-model="registryScenarioKey"
            aria-label="依赖混淆伪 registry 场景"
          >
            <option
              v-for="scenario in dependencyConfusionRegistryScenarioOptions"
              :key="scenario.key"
              :value="scenario.key"
            >
              {{ scenario.title }}
            </option>
          </select>
        </label>
        <label>
          <span>解析策略</span>
          <select
            v-model="resolutionPolicyKey"
            aria-label="依赖混淆解析策略"
          >
            <option
              v-for="policy in dependencyConfusionResolutionPolicyOptions"
              :key="policy.key"
              :value="policy.key"
            >
              {{ policy.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseUnscopedCollision"
          >
            未绑定 scope
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="choosePrivateScope"
          >
            私有 scope
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseIntegrityAudit"
          >
            完整性审计
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseMixedSource"
          >
            混合来源
          </button>
          <button type="submit" :disabled="isLoading">观察解析结果</button>
        </div>
      </form>

      <section
        class="dependency-confusion-status-panel"
        aria-label="依赖混淆实验状态"
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
          <span>当前样例</span>
          <strong>
            {{ result?.manifestSummary?.title ?? selectedManifest?.title }}
          </strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in resolutionRows" :key="row.label">
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

        <article v-if="result?.manifestSummary" class="document-preview">
          <span
            :class="
              result.resolution.sourceTrust === 'untrusted' ||
              result.resolution.sourceTrust === 'blocked'
                ? 'danger-pill'
                : 'status-pill'
            "
          >
            {{ result.resolution.sourceTrust }}
          </span>
          <h2>{{ result.manifestSummary.title }}</h2>
          <p>
            {{ result.manifestSummary.dependencyShape }} ·
            scope {{ result.manifestSummary.privateScopeBound ? "已绑定" : "缺失" }}
          </p>
          <p>{{ result.manifestSummary.learningNotes }}</p>
        </article>

        <p v-if="!result && selectedManifest" class="state-text">
          {{ selectedManifest.dependencyShape }} · {{ selectedManifest.description }}
        </p>
        <p v-if="!result && selectedRegistryScenario" class="state-text">
          {{ selectedRegistryScenario.description }}
        </p>
        <p v-if="!result && selectedResolutionPolicy" class="state-text">
          {{ selectedResolutionPolicy.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交依赖混淆固定解析观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="依赖混淆固定样例观察">
        <h2>固定样例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="manifest in manifestRows" :key="manifest.key">
            <strong>{{ manifest.title }}</strong>
            <span>{{ manifest.dependencyShape }} · {{ manifest.description }}</span>
            <small>{{ manifest.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="依赖混淆复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li
            v-for="item in dependencyConfusionReviewChecklist"
            :key="item.key"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
