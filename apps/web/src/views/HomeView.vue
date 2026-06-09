<script setup lang="ts">
import { RouterLink } from "vue-router";

import { products } from "../data/catalog";

const featuredProducts = products.slice(0, 3);
</script>

<template>
  <section class="hero-section">
    <div class="hero-copy">
      <p class="eyebrow">SafeMart Account Portal</p>
      <h1>常见业务网站的本机训练样板</h1>
      <p class="hero-text">
        商品、账户、订单、客服和实验入口集中在同一个功能型站点中，后续可逐步接入漏洞版与修复版对照。
      </p>
      <div class="hero-actions">
        <RouterLink class="primary-action" to="/products">查看商品</RouterLink>
        <RouterLink class="secondary-action" to="/login">登录账户</RouterLink>
      </div>
    </div>

    <div class="hero-panel" aria-label="今日账户概览">
      <div>
        <span class="metric-value">128</span>
        <span class="metric-label">今日订单</span>
      </div>
      <div>
        <span class="metric-value">7</span>
        <span class="metric-label">待处理留言</span>
      </div>
      <div>
        <span class="metric-value">15</span>
        <span class="metric-label">实验入口</span>
      </div>
    </div>
  </section>

  <section class="content-section">
    <div class="section-heading">
      <p class="eyebrow">Featured</p>
      <h2>热门商品</h2>
    </div>

    <div class="product-strip">
      <article v-for="product in featuredProducts" :key="product.id" class="product-tile">
        <span>{{ product.badge }}</span>
        <h3>{{ product.name }}</h3>
        <p>{{ product.summary }}</p>
        <strong>¥{{ product.price }}</strong>
      </article>
    </div>
  </section>
</template>
