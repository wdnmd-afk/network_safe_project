<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { fetchLabs, type LabMetadata } from "../api/labs";
import {
  createDefaultLabDirectoryFilters,
  deriveLabDepth,
  filterLabs,
  getLabFilterOptions,
  learningPaths,
  validateLearningPaths,
  type LabDirectoryFilters,
} from "../utils/lab-directory";

const labs = ref<LabMetadata[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const filters = ref<LabDirectoryFilters>(createDefaultLabDirectoryFilters());

const categoryTitles: Record<string, string> = {
  web: "Web 漏洞",
  auth: "认证授权",
  api: "API 安全",
  "business-logic": "业务逻辑",
  crypto: "密码学与数据保护",
  detection: "检测与响应",
  network: "网络与传输层",
  ai: "AI 与新型攻击",
  social: "社会工程学",
  malware: "恶意软件",
  client: "客户端攻击",
  "supply-chain": "供应链",
  infrastructure: "基础设施",
  host: "Windows 主机安全",
};

function formatCategoryTitle(category: string) {
  return categoryTitles[category] ?? category;
}

const groupedLabs = computed(() => {
  return filterLabs(labs.value, filters.value).reduce<Record<string, LabMetadata[]>>((groups, lab) => {
    groups[lab.category] ??= [];
    groups[lab.category].push(lab);
    return groups;
  }, {});
});

const filterOptions = computed(() => getLabFilterOptions(labs.value));
const visibleLabCount = computed(() => Object.values(groupedLabs.value).flat().length);
const labById = computed(() => new Map(labs.value.map((lab) => [lab.id, lab])));
const learningPathValidation = computed(() => validateLearningPaths(labs.value));
const learningPathRows = computed(() =>
  learningPaths.map((path) => ({
    ...path,
    labs: path.labIds
      .map((labId) => labById.value.get(labId))
      .filter((lab): lab is LabMetadata => Boolean(lab)),
  })),
);

function resetFilters() {
  filters.value = createDefaultLabDirectoryFilters();
}

function formatDepth(lab: LabMetadata) {
  return deriveLabDepth(lab);
}

function formatLevel(level: string) {
  const labels: Record<string, string> = {
    beginner: "初级",
    intermediate: "中级",
    advanced: "高级",
  };
  return labels[level] ?? level;
}

function labDetailPath(lab: LabMetadata | undefined) {
  return lab ? `/labs/${lab.category}/${lab.subcategory}` : "/labs";
}

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
      <section class="directory-toolbar" aria-label="实验目录筛选">
        <div class="directory-search">
          <label for="lab-directory-search">搜索实验</label>
          <input
            id="lab-directory-search"
            v-model="filters.query"
            type="search"
            placeholder="搜索标题、标签或知识点"
          />
        </div>
        <div class="directory-filters">
          <label>
            分类
            <select v-model="filters.category">
              <option value="all">全部分类</option>
              <option v-for="category in filterOptions.categories" :key="category" :value="category">
                {{ formatCategoryTitle(category) }}
              </option>
            </select>
          </label>
          <label>
            难度
            <select v-model="filters.difficulty">
              <option value="all">全部难度</option>
              <option v-for="difficulty in filterOptions.difficulties" :key="difficulty" :value="difficulty">
                {{ difficulty }}
              </option>
            </select>
          </label>
          <label>
            模式
            <select v-model="filters.mode">
              <option value="all">全部模式</option>
              <option v-for="mode in filterOptions.modes" :key="mode" :value="mode">
                {{ mode }}
              </option>
            </select>
          </label>
          <label>
            风险
            <select v-model="filters.severity">
              <option value="all">全部风险</option>
              <option v-for="severity in filterOptions.severities" :key="severity" :value="severity">
                {{ severity }}
              </option>
            </select>
          </label>
          <label>
            深度
            <select v-model="filters.depth">
              <option value="all">全部深度</option>
              <option v-for="depth in filterOptions.depths" :key="depth" :value="depth">
                {{ depth }}
              </option>
            </select>
          </label>
          <button type="button" class="secondary-button" @click="resetFilters">清除筛选</button>
        </div>
        <p class="directory-result-count">显示 {{ visibleLabCount }} / {{ labs.length }} 个实验</p>
      </section>

      <section class="learning-path-panel" aria-label="学习路径">
        <div class="compact-heading">
          <p class="eyebrow">Learning paths</p>
          <h2>静态学习路径</h2>
        </div>
        <div class="learning-path-list">
          <article v-for="path in learningPathRows" :key="path.id" class="learning-path-row">
            <div>
              <strong>{{ path.title }}</strong>
              <span>{{ formatLevel(path.level) }} · {{ path.labIds.length }} 个实验</span>
              <p>{{ path.description }}</p>
              <ol class="learning-path-sequence">
                <li v-for="pathLab in path.labs" :key="pathLab.id">
                  <RouterLink :to="labDetailPath(pathLab)">{{ pathLab.title }}</RouterLink>
                </li>
              </ol>
            </div>
            <RouterLink class="secondary-action" :to="labDetailPath(path.labs[0])">
              从第一项开始
            </RouterLink>
          </article>
        </div>
        <p v-if="!learningPathValidation.ok" class="error-text">
          学习路径定义存在未登记实验，请检查静态路径配置。
        </p>
      </section>

      <p v-if="visibleLabCount === 0" class="state-text">没有符合当前筛选条件的实验。</p>
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
              <span>{{ formatDepth(lab) }}</span>
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
