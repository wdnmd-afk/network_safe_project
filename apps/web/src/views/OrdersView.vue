<script setup lang="ts">
import { orders } from "../data/catalog";
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Orders</p>
      <h1>订单列表</h1>
      <p>订单详情和归属关系会作为后续 IDOR 与权限实验的业务基础。</p>
    </div>

    <div class="table-surface" role="region" aria-label="订单列表">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>商品</th>
            <th>归属</th>
            <th>金额</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.productName }}</td>
            <td>{{ order.owner }}</td>
            <td>¥{{ order.amount }}</td>
            <td><span class="status-pill">{{ order.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
