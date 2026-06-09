<template>
  <section class="auth-layout">
    <div class="section-heading">
      <p class="eyebrow">Member Login</p>
      <h1>登录 SafeMart</h1>
      <p>此页面用于后续承载认证、会话和暴力破解类实验。</p>
    </div>

    <form class="form-panel">
      <label>
        <span>用户名</span>
        <input type="text" autocomplete="username" placeholder="demo_user" />
      </label>
      <label>
        <span>密码</span>
        <input type="password" autocomplete="current-password" placeholder="输入密码" />
      </label>
      <button type="button">登录</button>
    </form>
  </section>
</template>
