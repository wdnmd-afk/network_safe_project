# XSS 模拟资源

当前 XSS 样板实验不需要额外模拟数据文件。

页面使用前端内置的客服留言初始数据和惰性 HTML 样例 payload：

```html
<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>
```

后续若需要补充更多安全样例，应优先放在本目录，并继续保持本机受控、不可用于外部目标的边界。
