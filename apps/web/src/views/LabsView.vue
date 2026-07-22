<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { fetchLabs, type LabMetadata } from "../api/labs";

const labs = ref<LabMetadata[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const categoryTitles: Record<string, string> = {
  web: "Web 漏洞",
  auth: "认证授权",
  network: "网络与传输层",
  ai: "AI 与新型攻击",
  social: "社会工程学",
  malware: "恶意软件",
  client: "客户端攻击",
  "supply-chain": "供应链",
  infrastructure: "基础设施",
};

function formatCategoryTitle(category: string) {
  return categoryTitles[category] ?? category;
}

const groupedLabs = computed(() => {
  return labs.value.reduce<Record<string, LabMetadata[]>>((groups, lab) => {
    groups[lab.category] ??= [];
    groups[lab.category].push(lab);
    return groups;
  }, {});
});

onMounted(async () => {
  try {
    const response = await fetchLabs();
    labs.value = response.items;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "实验列表加载失败";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Labs</p>
      <h1>实验入口</h1>
      <p>实验列表来自后端 `/api/labs`，当前展示开发态元数据索引。</p>
    </div>

    <p v-if="isLoading" class="state-text">正在加载实验列表...</p>
    <p v-else-if="errorMessage" class="state-text error-text">{{ errorMessage }}</p>

    <div v-else class="lab-directory">
      <section
        v-for="(categoryLabs, category) in groupedLabs"
        :key="category"
        class="lab-category"
      >
        <div class="section-heading compact-heading">
          <p class="eyebrow">{{ category }}</p>
          <h2>{{ formatCategoryTitle(category) }}</h2>
        </div>

        <div class="lab-grid">
          <article v-for="lab in categoryLabs" :key="lab.id" class="lab-card">
            <div class="lab-card-header">
              <span class="status-pill">{{ lab.status }}</span>
              <span>{{ lab.difficulty }}</span>
            </div>
            <h3>{{ lab.title }}</h3>
            <p>{{ lab.summary }}</p>
            <div class="lab-meta">
              <span>{{ lab.severity }}</span>
              <span>{{ lab.mode }}</span>
              <span>{{ lab.variants.length }} 个变体</span>
            </div>
            <div class="lab-list">
              <RouterLink :to="`/labs/${lab.category}/${lab.subcategory}`">
                查看详情
              </RouterLink>
              <RouterLink
                v-for="variant in lab.variants"
                :key="variant.key"
                :to="`/labs/${lab.category}/${lab.subcategory}/${variant.key}`"
              >
                {{ variant.title }}
              </RouterLink>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
