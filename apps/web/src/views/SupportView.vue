<template>
  <section class="page-section two-column">
    <div class="section-heading">
      <p class="eyebrow">Support</p>
      <h1>客服留言</h1>
      <p>留言、反馈和附件上传入口后续可接入 XSS、CSRF 与文件上传实验。</p>
    </div>

    <form class="form-panel">
      <label>
        <span>问题标题</span>
        <input type="text" placeholder="例如：订单状态异常" />
      </label>
      <label>
        <span>详细说明</span>
        <textarea rows="6" placeholder="描述你遇到的问题"></textarea>
      </label>
      <button type="button">提交留言</button>
    </form>
  </section>
</template>
