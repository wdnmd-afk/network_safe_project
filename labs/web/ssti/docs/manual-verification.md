# SSTI 手动验证

## 页面验证

### 漏洞版正常模板

1. 打开 `/labs/web/ssti/vuln`。
2. 点击“填入正常模板”。
3. 点击“预览通知”。
4. 预期信号：`ssti-safe-template-rendered`。

### 漏洞版受控表达式

1. 打开 `/labs/web/ssti/vuln`。
2. 点击“填入表达式样例”。
3. 点击“预览通知”。
4. 预期信号：`ssti-expression-evaluated`。
5. 预览文本中只应出现固定教学结果 `49`。

### 漏洞版受控上下文

1. 打开 `/labs/web/ssti/vuln`。
2. 点击“填入上下文样例”。
3. 点击“预览通知”。
4. 预期信号：`ssti-template-context-exposed`。
5. 预览文本中只应出现虚拟上下文说明。

### 修复版阻断

1. 打开 `/labs/web/ssti/fixed`。
2. 点击“填入表达式样例”。
3. 点击“预览通知”。
4. 预期信号：`ssti-expression-blocked`。
5. HTTP 状态应为 `403`。

## API 验证

接口：

```text
POST /api/labs/web/ssti/:variant/preview
```

请求体包含：

```json
{
  "templateKey": "shipping-notice",
  "templateText": "尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}",
  "variables": {
    "customerName": "演示用户",
    "orderNo": "ORDER-1001",
    "noticeTitle": "发货提醒"
  }
}
```

## 日志验证

统一事件日志应记录：

- `labKey`: `web.ssti`
- `variantKey`: `vuln` 或 `fixed`
- `phase`: `attack`、`defense` 或 `normal`
- `signal`: SSTI 学习信号
- `inputSummary`: 模板长度、变量名、表达式类别、是否命中受控样例

日志不应记录：

- 完整模板文本
- 完整表达式
- 完整变量值
- 真实服务器上下文
- 真实 token、Cookie 或密钥
