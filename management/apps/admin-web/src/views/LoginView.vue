<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();
const route = useRoute();

const username = ref("admin");
const password = ref("");

async function handleSubmit() {
  const succeeded = await session.login({
    username: username.value,
    password: password.value,
  });

  if (!succeeded) {
    return;
  }

  const redirect = route.query.redirect;
  const target = typeof redirect === "string" && redirect.startsWith("/")
    ? redirect
    : "/overview";

  void router.push(target);
}
</script>

<template>
  <div class="login-page">
    <section class="login-card">
      <h1>Network Safe 管理端</h1>
      <p class="muted">本机实验平台的运行期配置与审计入口。</p>

      <form @submit.prevent="handleSubmit">
        <label class="field">
          <span>管理员账号</span>
          <input v-model="username" name="username" autocomplete="username" required />
        </label>

        <label class="field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
        </label>

        <p v-if="session.errorMessage" class="alert alert-danger" role="alert">
          {{ session.errorMessage }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="session.isLoading">
          {{ session.isLoading ? "登录中…" : "登录" }}
        </button>
      </form>

      <p class="login-note">
        该账号可读取全部用户的事件日志并修改实验启停配置，仅限本机使用。
      </p>
    </section>
  </div>
</template>
