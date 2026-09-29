<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}
</script>

<template>
  <label class="switch">
    <input
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      @change="handleChange"
    />
    <span class="switch-track" aria-hidden="true"></span>
    <!-- 状态除颜色外必须有文案：开启/停用直接写在开关旁边 -->
    <span>{{ props.label }}</span>
  </label>
</template>
