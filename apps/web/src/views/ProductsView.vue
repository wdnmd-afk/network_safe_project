<script setup lang="ts">
import { computed, ref } from "vue";

import { products } from "../data/catalog";
import { filterProducts } from "../utils/catalog";

const keyword = ref("");
const filteredProducts = computed(() => filterProducts(products, keyword.value));
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Catalog</p>
      <h1>商品列表</h1>
      <p>搜索和筛选是后续实验常见输入入口，本阶段仅提供正常业务行为。</p>
    </div>

    <label class="search-box">
      <span>搜索商品</span>
      <input v-model="keyword" type="search" placeholder="输入 secure、account 或 support" />
    </label>

    <div class="table-surface" role="region" aria-label="商品库存列表">
      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>分类</th>
            <th>库存</th>
            <th>价格</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td>
              <strong>{{ product.name }}</strong>
              <small>{{ product.summary }}</small>
            </td>
            <td>{{ product.category }}</td>
            <td>{{ product.stock }}</td>
            <td>¥{{ product.price }}</td>
            <td><span class="status-pill">{{ product.badge }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
