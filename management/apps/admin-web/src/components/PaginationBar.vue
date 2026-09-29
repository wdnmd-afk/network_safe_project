<script setup lang="ts">
const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (event: "change", page: number): void }>();

function lastPage() {
  return Math.max(Math.ceil(props.total / props.pageSize), 1);
}

function go(target: number) {
  const clamped = Math.min(Math.max(target, 1), lastPage());

  if (clamped !== props.page) {
    emit("change", clamped);
  }
}
</script>

<template>
  <div class="pagination">
    <span>
      共 {{ total }} 条 · 第 {{ page }} / {{ lastPage() }} 页 · 每页 {{ pageSize }} 条
    </span>
    <div class="pagination-actions">
      <button
        type="button"
        class="btn"
        :disabled="disabled || page <= 1"
        @click="go(page - 1)"
      >
        上一页
      </button>
      <button
        type="button"
        class="btn"
        :disabled="disabled || page >= lastPage()"
        @click="go(page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>
