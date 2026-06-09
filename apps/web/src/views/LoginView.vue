<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useSessionStore } from "../stores/session";

const router = useRouter();
const session = useSessionStore();
const username = ref("demo_user");
const password = ref("Demo@123456");
const errorMessage = ref("");

async function submitLogin() {
  errorMessage.value = "";

  try {
    await session.login({
      username: username.value,
      password: password.value,
    });
    await router.push("/account");
  } catch {
    errorMessage.value = "用户名或密码不正确";
  }
}
</script>

<template>
  <section class="auth-layout">
    <div class="section-heading">
      <p class="eyebrow">Member Login</p>
      <h1>登录 SafeMart</h1>
      <p>使用本机 MySQL 用户表完成登录，账户中心会读取当前登录用户资料。</p>
    </div>

    <form class="form-panel" @submit.prevent="submitLogin">
      <label>
        <span>用户名</span>
        <input v-model="username" type="text" autocomplete="username" />
      </label>
      <label>
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <p class="form-hint">可用账号：admin / Admin@123456，demo_user / Demo@123456</p>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      <button type="submit" :disabled="session.isLoading">
        {{ session.isLoading ? "登录中..." : "登录" }}
      </button>
    </form>
  </section>
</template>
