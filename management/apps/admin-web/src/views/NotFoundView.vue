<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="empty-state">
    <strong>页面不存在</strong>
    <span>该地址没有对应的管理端页面。</span>
    <RouterLink to="/overview">返回总览</RouterLink>
  </div>
</template>
