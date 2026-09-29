<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (event: "confirm"): void;
  (event: "cancel"): void;
}>();
</script>

<template>
  <div
    v-if="props.open"
    class="dialog-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="props.title"
    @click.self="emit('cancel')"
  >
    <div class="dialog">
      <h2>{{ props.title }}</h2>
      <p class="muted">{{ props.message }}</p>
      <div class="dialog-actions">
        <button type="button" class="btn" :disabled="props.busy" @click="emit('cancel')">
          取消
        </button>
        <button
          type="button"
          class="btn"
          :class="props.danger ? 'btn-danger' : 'btn-primary'"
          :disabled="props.busy"
          @click="emit('confirm')"
        >
          {{ props.busy ? "处理中…" : props.confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
