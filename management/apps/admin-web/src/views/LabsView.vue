<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { AdminLab } from "@nsm/shared";

import { fetchLabs, setLabEnabled, setVariantEnabled } from "../api/admin";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import EmptyState from "../components/EmptyState.vue";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import {
  describeToggle,
  groupLabsByCategory,
  summarizeLabCounts,
  type ToggleIntent,
} from "../modules/labs";

type PendingToggle = {
  intent: ToggleIntent;
  apply: () => Promise<void>;
};

const labs = ref<AdminLab[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const statusMessage = ref("");
const busyKey = ref("");
const pending = ref<PendingToggle | null>(null);
const query = ref("");

const filteredLabs = computed(() => {
  const keyword = query.value.trim().toLowerCase();

  if (!keyword) {
    return labs.value;
  }

  return labs.value.filter((lab) =>
    [lab.labKey, lab.title, lab.categoryName].join(" ").toLowerCase().includes(keyword),
  );
});

const groups = computed(() => groupLabsByCategory(filteredLabs.value));
const counts = computed(() => summarizeLabCounts(labs.value));

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchLabs();
    labs.value = response.items;
  } catch (error) {
    labs.value = [];
    errorMessage.value =
      error instanceof Error ? error.message : "实验目录加载失败";
  } finally {
    isLoading.value = false;
  }
}

function requestLabToggle(lab: AdminLab, nextEnabled: boolean) {
  pending.value = {
    intent: describeToggle("lab", nextEnabled),
    apply: async () => {
      busyKey.value = `lab:${lab.labKey}`;

      try {
        const result = await setLabEnabled(lab.labKey, nextEnabled);
        lab.isEnabled = result.after.isEnabled;
        statusMessage.value = `已${nextEnabled ? "启用" : "停用"}实验 ${lab.labKey}。`;
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : "启停操作失败";
      } finally {
        busyKey.value = "";
      }
    },
  };
}

function requestVariantToggle(
  lab: AdminLab,
  variantKey: string,
  nextEnabled: boolean,
) {
  const variant = lab.variants.find((item) => item.variantKey === variantKey);

  if (!variant) {
    return;
  }

  pending.value = {
    intent: describeToggle("variant", nextEnabled),
    apply: async () => {
      busyKey.value = `variant:${lab.labKey}:${variantKey}`;

      try {
        const result = await setVariantEnabled(lab.labKey, variantKey, nextEnabled);
        variant.isEnabled = result.after.isEnabled;
        statusMessage.value = `已${nextEnabled ? "启用" : "停用"} ${lab.labKey} 的 ${variantKey} 变体。`;
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : "启停操作失败";
      } finally {
        busyKey.value = "";
      }
    },
  };
}

async function confirmToggle() {
  const action = pending.value;

  if (!action) {
    return;
  }

  await action.apply();
  pending.value = null;
}

onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Configuration</span>
        <h2>实验与变体启停</h2>
        <p class="panel-hint">
          停用后主站目录、实验接口与前台页面三层同时生效。每次变更都会写入操作审计。
        </p>
      </div>
      <button type="button" class="btn" :disabled="isLoading" @click="load">
        刷新
      </button>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>搜索</span>
        <input v-model="query" placeholder="实验名、labKey 或分类" />
      </label>
      <span v-if="!isLoading" class="panel-hint">
        {{ counts.enabledLabs }} / {{ counts.labs }} 个实验启用 ·
        {{ counts.enabledVariants }} / {{ counts.variants }} 个变体启用
      </span>
    </div>
  </section>

  <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
  <p v-if="statusMessage" class="alert" role="status">{{ statusMessage }}</p>

  <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>

  <EmptyState
    v-else-if="labs.length === 0"
    title="数据库中没有实验记录"
    description="请先在主项目执行 pnpm db:prepare 同步实验元数据，管理端不负责建表与灌数据。"
  />

  <EmptyState
    v-else-if="groups.length === 0"
    title="没有匹配的实验"
    description="换个关键字再试。"
  />

  <template v-else>
    <section
      v-for="group in groups"
      :key="group.categoryCode"
      class="panel"
      :aria-label="group.categoryName"
    >
      <div class="panel-heading">
        <div>
          <span class="panel-label">{{ group.categoryCode }}</span>
          <h2>{{ group.categoryName }}</h2>
        </div>
        <span class="panel-hint">{{ group.labs.length }} 个实验</span>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>实验</th>
              <th>状态</th>
              <th>实验启用</th>
              <th>变体</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lab in group.labs" :key="lab.labKey">
              <td>
                <strong>{{ lab.title }}</strong>
                <div class="faint mono">{{ lab.labKey }}</div>
              </td>
              <td>
                <span class="badge">{{ lab.status }}</span>
                <span class="badge">{{ lab.severity }}</span>
              </td>
              <td>
                <ToggleSwitch
                  :model-value="lab.isEnabled"
                  :label="lab.isEnabled ? '已启用' : '已停用'"
                  :disabled="busyKey === `lab:${lab.labKey}`"
                  @update:model-value="requestLabToggle(lab, $event)"
                />
              </td>
              <td>
                <div class="stack">
                  <ToggleSwitch
                    v-for="variant in lab.variants"
                    :key="variant.variantKey"
                    :model-value="variant.isEnabled"
                    :label="`${variant.title}（${variant.variantKey}）`"
                    :disabled="busyKey === `variant:${lab.labKey}:${variant.variantKey}`"
                    @update:model-value="
                      requestVariantToggle(lab, variant.variantKey, $event)
                    "
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>

  <ConfirmDialog
    :open="Boolean(pending)"
    :title="pending?.intent.title ?? ''"
    :message="pending?.intent.message ?? ''"
    :confirm-label="pending?.intent.confirmLabel ?? '确认'"
    :danger="pending?.intent.danger ?? false"
    :busy="busyKey !== ''"
    @confirm="confirmToggle"
    @cancel="pending = null"
  />
</template>
