# XSS 漏洞版

## 目标

演示客服留言内容被当作 HTML 输出时，用户输入可以改变页面结构。

## 实现方式

漏洞版页面位于：

```text
/labs/web/xss/vuln
```

页面使用本机固定样例：

```html
<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>
```

提交后，页面会解释该 HTML 标记并显示黄色模拟信号。

## 安全边界

该样例不执行 JavaScript，不读取 Cookie，不发送网络请求，只用于说明未转义输出风险。
