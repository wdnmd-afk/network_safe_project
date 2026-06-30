<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";

import {
  fetchCurrentUserRecapQuestionCompletions,
  type CurrentUserLabEventLogSummary,
  type LabEventLogFilters,
  type UserRecapQuestionCompletionSummary,
} from "../api/lab-records";
import EventRecapCard from "../components/EventRecapCard.vue";
import {
  createLabEventLogLabOptions,
  createLabRecapCompletionSummaries,
} from "../labs/account-recap";
import {
  createAccountEventRecapCardContent,
  useEventRecapExpansionState,
} from "../labs/event-recap";
import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();
const {
  displayName,
  errorMessage,
  isAuthenticated,
  isLoadingLabEventLogs,
  isLoading,
  isLoadingLabRecords,
  labEventLogs,
  labEventLogsErrorMessage,
  labRecords,
  labRecordsErrorMessage,
  user,
} = storeToRefs(session);

const avatarText = computed(() => displayName.value.slice(0, 1));
const eventLabFilter = ref("");
const eventPhaseFilter = ref<"" | NonNullable<LabEventLogFilters["phase"]>>("");
const eventRiskFilter = ref<"" | NonNullable<LabEventLogFilters["riskLevel"]>>("");
const recapQuestionCompletions = ref<UserRecapQuestionCompletionSummary[]>([]);
const isLoadingRecapQuestionCompletions = ref(false);
const recapQuestionCompletionErrorMessage = ref("");
const eventRecapExpansion = useEventRecapExpansionState();

const eventLogFilters = computed<LabEventLogFilters>(() => ({
  ...(eventLabFilter.value ? { labKey: eventLabFilter.value } : {}),
  ...(eventPhaseFilter.value ? { phase: eventPhaseFilter.value } : {}),
  ...(eventRiskFilter.value ? { riskLevel: eventRiskFilter.value } : {}),
}));

const eventLabOptions = computed(() =>
  createLabEventLogLabOptions({
    records: labRecords.value,
    events: labEventLogs.value,
    selectedLabKey: eventLabFilter.value || undefined,
  }),
);

const recapCompletionSummaries = computed(() =>
  createLabRecapCompletionSummaries({
    events: labEventLogs.value,
    completions: recapQuestionCompletions.value,
  }),
);

onMounted(() => {
  if (!user.value) {
    void session.loadCurrentUser();
  }

  void session.loadLabRecordSummary();
  void refreshEventLogs();
});

async function logout() {
  await session.logout();
  await router.push("/login");
}

async function loadRecapQuestionCompletions(
  events: CurrentUserLabEventLogSummary[],
) {
  if (!session.token || events.length === 0) {
    recapQuestionCompletions.value = [];
    recapQuestionCompletionErrorMessage.value = "";
    return;
  }

  const traceIds = [...new Set(events.map((event) => event.traceId))];

  isLoadingRecapQuestionCompletions.value = true;
  recapQuestionCompletionErrorMessage.value = "";

  try {
    const result = await fetchCurrentUserRecapQuestionCompletions(
      session.token,
      {
        ...(eventLabFilter.value ? { labKey: eventLabFilter.value } : {}),
        traceIds,
      },
    );

    recapQuestionCompletions.value = result.items;
  } catch (error) {
    recapQuestionCompletions.value = [];
    recapQuestionCompletionErrorMessage.value =
      error instanceof Error ? error.message : "复盘问题完成度加载失败";
  } finally {
    isLoadingRecapQuestionCompletions.value = false;
  }
}

async function refreshEventLogs() {
  eventRecapExpansion.resetExpandedEvents();
  recapQuestionCompletions.value = [];
  const events = await session.loadLabEventLogs(eventLogFilters.value);
  await loadRecapQuestionCompletions(events);
}
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Account</p>
      <h1>账户中心</h1>
      <p>当前资料来自后端 `/api/auth/me`，用于后续认证、授权和会话类实验。</p>
    </div>

    <div v-if="isLoading" class="profile-panel">
      <div>
        <h2>正在读取账户资料</h2>
        <p>请稍候</p>
      </div>
    </div>

    <div v-else-if="!isAuthenticated" class="profile-panel">
      <div>
        <h2>尚未登录</h2>
        <p>{{ errorMessage || "登录后可以查看 MySQL 用户资料。" }}</p>
      </div>
      <RouterLink class="secondary-action" to="/login">去登录</RouterLink>
    </div>

    <div v-else class="account-grid">
      <section class="profile-panel">
        <span class="avatar" aria-hidden="true">{{ avatarText }}</span>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ user?.username }}</p>
        </div>
      </section>

      <section class="profile-panel">
        <div>
          <h2>{{ user?.role }}</h2>
          <p>角色</p>
        </div>
        <button type="button" @click="logout">退出登录</button>
      </section>

      <section class="profile-panel">
        <div>
          <h2>{{ user?.status }}</h2>
          <p>账户状态</p>
        </div>
      </section>

      <section class="profile-panel records-panel">
        <div>
          <h2>学习进度</h2>
          <p v-if="isLoadingLabRecords">正在读取实验记录</p>
          <p v-else-if="labRecordsErrorMessage">{{ labRecordsErrorMessage }}</p>
          <p v-else-if="labRecords.progress.length === 0">暂无学习记录</p>
          <ul v-else class="record-list">
            <li v-for="item in labRecords.progress" :key="`${item.labKey}-progress`">
              <strong>{{ item.title }}</strong>
              <span>{{ item.variantKey }} / {{ item.status }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="profile-panel records-panel">
        <div>
          <h2>最近验证</h2>
          <p v-if="isLoadingLabRecords">正在读取验证记录</p>
          <p v-else-if="labRecordsErrorMessage">{{ labRecordsErrorMessage }}</p>
          <p v-else-if="labRecords.verifications.length === 0">暂无验证记录</p>
          <ul v-else class="record-list">
            <li
              v-for="item in labRecords.verifications"
              :key="`${item.labKey}-${item.createdAt}`"
            >
              <strong>{{ item.title }}</strong>
              <span>{{ item.variantKey }} / {{ item.result }}</span>
              <small>{{ item.summary }}</small>
            </li>
          </ul>
        </div>
      </section>

      <section class="profile-panel records-panel">
        <div>
          <h2>最近事件复盘</h2>
          <div class="filter-row">
            <label>
              <span>实验</span>
              <select v-model="eventLabFilter" @change="refreshEventLogs">
                <option value="">全部</option>
                <option
                  v-for="option in eventLabOptions"
                  :key="option.labKey"
                  :value="option.labKey"
                >
                  {{ option.title }}
                </option>
              </select>
            </label>
            <label>
              <span>阶段</span>
              <select v-model="eventPhaseFilter" @change="refreshEventLogs">
                <option value="">全部</option>
                <option value="attack">攻击</option>
                <option value="defense">防御</option>
                <option value="normal">正常</option>
              </select>
            </label>
            <label>
              <span>风险</span>
              <select v-model="eventRiskFilter" @change="refreshEventLogs">
                <option value="">全部</option>
                <option value="critical">critical</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </div>
          <p v-if="isLoadingLabEventLogs">正在读取事件日志</p>
          <p v-else-if="labEventLogsErrorMessage">{{ labEventLogsErrorMessage }}</p>
          <p v-else-if="labEventLogs.length === 0">暂无事件日志</p>
          <template v-else>
            <div class="recap-completion-panel">
              <strong>复盘完成度</strong>
              <p v-if="isLoadingRecapQuestionCompletions">
                正在读取复盘问题完成度
              </p>
              <p v-else-if="recapQuestionCompletionErrorMessage" class="error-text">
                {{ recapQuestionCompletionErrorMessage }}
              </p>
              <ul v-else class="record-list recap-completion-list">
                <li
                  v-for="summary in recapCompletionSummaries"
                  :key="summary.labKey"
                >
                  <strong>{{ summary.title }}</strong>
                  <span>
                    {{ summary.completedQuestions }} /
                    {{ summary.totalQuestions }} 个问题
                  </span>
                  <small>
                    最近 {{ summary.eventCount }} 条事件 /
                    {{ summary.completionPercent }}%
                  </small>
                </li>
              </ul>
            </div>

            <ul class="record-list">
              <EventRecapCard
                v-for="event in labEventLogs"
                :key="event.traceId"
                :content="createAccountEventRecapCardContent(event)"
                :expanded="eventRecapExpansion.isEventExpanded(event.traceId)"
                @toggle-expanded="
                  eventRecapExpansion.toggleEventExpanded(event.traceId)
                "
              />
            </ul>
          </template>
        </div>
      </section>
    </div>
  </section>
</template>
