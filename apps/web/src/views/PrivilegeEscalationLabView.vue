<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitPrivilegeEscalationExecute,
  type PrivilegeEscalationResult,
} from "../api/privilege-escalation-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  adminOperationKeySample,
  attackRequestedRoleSample,
  createPrivilegeEscalationLearningProgress,
  createPrivilegeEscalationVerificationRecord,
  formatPrivilegeEscalationSignal,
  getPrivilegeEscalationVariantConfig,
  normalOperationKeySample,
  normalRequestedRoleSample,
  type PrivilegeEscalationVariantKey,
} from "../labs/privilege-escalation";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PrivilegeEscalationVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPrivilegeEscalationVariantConfig(props.variant));
const operationKeyText = ref(normalOperationKeySample);
const requestedRoleText = ref(normalRequestedRoleSample);
const result = ref<PrivilegeEscalationResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatPrivilegeEscalationSignal(result.value.signal)
    : "尚未执行操作",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "客户端声明",
      value: result.value.inspection.requestedRole,
    },
    {
      label: "服务端角色",
      value: result.value.inspection.currentUserRole,
    },
    {
      label: "有效角色",
      value: result.value.inspection.effectiveRole,
    },
    {
      label: "信任客户端",
      value: result.value.inspection.trustedClientRole ? "是" : "否",
    },
    {
      label: "管理操作",
      value: result.value.inspection.privilegedOperation ? "是" : "否",
    },
    {
      label: "权限通过",
      value: result.value.inspection.roleAllowed ? "是" : "否",
    },
  ];
});

const operationRows = computed(() => {
  if (!result.value?.operation) {
    return [];
  }

  return [
    {
      label: "操作",
      value: result.value.operation.title,
    },
    {
      label: "操作 key",
      value: result.value.operation.key,
    },
    {
      label: "要求角色",
      value: result.value.operation.requiredRole,
    },
    {
      label: "结果摘要",
      value: result.value.operation.resultSummary,
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
      "privilege-escalation",
      session.token,
      createPrivilegeEscalationLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(privilegeResult: PrivilegeEscalationResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    privilegeResult.signal === "privilege-client-role-admin-accepted";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    privilegeResult.signal === "privilege-client-role-admin-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "auth",
      "privilege-escalation",
      session.token,
      createPrivilegeEscalationVerificationRecord(config.value, privilegeResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalOperationSample() {
  operationKeyText.value = normalOperationKeySample;
  requestedRoleText.value = normalRequestedRoleSample;
  result.value = null;
  actionMessage.value = "已填入普通用户正常操作样例";
  errorMessage.value = "";
}

function useAdminOperationSample() {
  operationKeyText.value = adminOperationKeySample;
  requestedRoleText.value = attackRequestedRoleSample;
  result.value = null;
  actionMessage.value = "已填入客户端 admin 声明攻击样例";
  errorMessage.value = "";
}

async function submitOperation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行权限提升实验";
    return;
  }

  const normalizedOperationKey = operationKeyText.value.trim();
  const normalizedRequestedRole = requestedRoleText.value.trim();

  if (!normalizedOperationKey || !normalizedRequestedRole) {
    errorMessage.value = "请填写操作 key 和客户端声明角色";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitPrivilegeEscalationExecute(
      config.value.key,
      session.token,
      {
        operationKey: normalizedOperationKey,
        requestedRole: normalizedRequestedRole,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "权限提升实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    operationKeyText.value = normalOperationKeySample;
    requestedRoleText.value = normalRequestedRoleSample;
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
      <p class="eyebrow">auth / privilege escalation</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/auth/privilege-escalation/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/auth/privilege-escalation/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="privilege-escalation-workbench">
      <form class="form-panel" @submit.prevent="submitOperation">
        <label>
          <span>操作 key</span>
          <input v-model="operationKeyText" aria-label="操作 key" />
        </label>
        <label>
          <span>客户端声明角色</span>
          <input v-model="requestedRoleText" aria-label="客户端声明角色" />
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="useNormalOperationSample"
          >
            普通操作
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useAdminOperationSample"
          >
            客户端 admin 声明
          </button>
          <button type="submit" :disabled="isLoading">执行操作</button>
        </div>
      </form>

      <section
        class="privilege-escalation-status-panel"
        aria-label="权限提升实验状态"
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
          <span>有效角色</span>
          <strong>{{ result?.inspection.effectiveRole ?? "unknown" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.operation" class="document-preview">
          <span
            :class="
              result.inspection.privilegedOperation ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.inspection.privilegedOperation ? "管理操作" : "普通操作" }}
          </span>
          <h2>操作结果摘要</h2>
          <dl class="inspection-grid">
            <div v-for="row in operationRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </article>

        <article
          v-else-if="result?.inspection.privilegedOperation"
          class="document-preview"
        >
          <span class="danger-pill">已阻断</span>
          <h2>权限判定结果</h2>
          <p>
            客户端声明 {{ result.inspection.requestedRole }}，但服务端登录态角色为
            {{ result.inspection.currentUserRole }}，后端没有执行管理操作。
          </p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控权限提升实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
