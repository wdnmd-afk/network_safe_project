<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitCommandInjectionRun,
  type CommandInjectionResult,
} from "../api/command-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  attackCommandInjectionTarget,
  createCommandInjectionLearningProgress,
  createCommandInjectionVerificationRecord,
  formatCommandInjectionSignal,
  getCommandInjectionVariantConfig,
  normalCommandInjectionTarget,
  normalCommandInjectionTaskKey,
  type CommandInjectionVariantKey,
} from "../labs/command-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: CommandInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getCommandInjectionVariantConfig(props.variant));
const taskKey = ref(normalCommandInjectionTaskKey);
const target = ref(normalCommandInjectionTarget);
const result = ref<CommandInjectionResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatCommandInjectionSignal(result.value.signal)
    : "尚未运行诊断",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "目标长度",
      value: String(result.value.inspection.targetLength),
    },
    {
      label: "检测到连接符",
      value: result.value.inspection.containsCommandSeparator ? "是" : "否",
    },
    {
      label: "操作符类型",
      value: result.value.inspection.detectedOperator,
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
      "command-injection",
      session.token,
      createCommandInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机攻防观察。
  }
}

async function recordVerification(runResult: CommandInjectionResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    runResult.signal === "command-injection-virtual-command-executed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    runResult.signal === "command-injection-allowlist-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "command-injection",
      session.token,
      createCommandInjectionVerificationRecord(config.value, runResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalSample() {
  taskKey.value = normalCommandInjectionTaskKey;
  target.value = normalCommandInjectionTarget;
  result.value = null;
  actionMessage.value = "已填入正常诊断目标";
  errorMessage.value = "";
}

function useAttackSample() {
  taskKey.value = normalCommandInjectionTaskKey;
  target.value = attackCommandInjectionTarget;
  result.value = null;
  actionMessage.value = "已填入受控命令注入样例";
  errorMessage.value = "";
}

async function submitRun() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行命令注入实验";
    return;
  }

  const normalizedTaskKey = taskKey.value.trim();
  const normalizedTarget = target.value.trim();

  if (!normalizedTaskKey || !normalizedTarget) {
    errorMessage.value = "请选择诊断任务并填写虚拟目标";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitCommandInjectionRun(
      config.value.key,
      session.token,
      {
        taskKey: normalizedTaskKey,
        target: normalizedTarget,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "命令注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    taskKey.value = normalCommandInjectionTaskKey;
    target.value = normalCommandInjectionTarget;
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
      <p class="eyebrow">web / command injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/command-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/command-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="command-injection-workbench">
      <form class="form-panel" @submit.prevent="submitRun">
        <label>
          <span>诊断任务</span>
          <select v-model="taskKey" aria-label="诊断任务">
            <option value="cache-status">缓存节点状态</option>
            <option value="queue-depth">队列堆积</option>
            <option value="release-health">发布健康度</option>
          </select>
        </label>
        <label>
          <span>虚拟目标</span>
          <input v-model="target" type="text" aria-label="虚拟目标" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalSample">
            填入正常目标
          </button>
          <button type="button" class="secondary-button" @click="useAttackSample">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">运行诊断</button>
        </div>
      </form>

      <section
        class="command-injection-status-panel"
        aria-label="命令注入实验状态"
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
          <span>虚拟步骤</span>
          <strong>{{ result ? result.virtualSteps.length : 0 }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <ul v-if="result" class="record-list">
          <li v-for="step in result.virtualSteps" :key="step.label">
            <strong>{{ step.label }}</strong>
            <span>{{ step.injected ? "虚拟额外步骤" : "正常诊断步骤" }}</span>
            <small>{{ step.output }}</small>
          </li>
        </ul>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控命令注入实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
