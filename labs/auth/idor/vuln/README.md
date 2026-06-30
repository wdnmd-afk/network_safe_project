# IDOR 漏洞版

## 漏洞点

漏洞版接口只根据请求体中的 `orderId` 查找订单，并直接返回订单详情，没有校验该订单是否属于当前登录用户。

## 攻击方视角

攻击者先观察自己订单的请求格式：

```json
{
  "orderId": "order-1001"
}
```

随后把对象 ID 替换为他人的受控样例：

```json
{
  "orderId": "order-2001"
}
```

漏洞版会返回他人订单详情，学习信号为：

```text
idor-cross-user-order-exposed
```

## 日志观察

事件日志会记录：

- `labKey`: `auth.idor`
- `variantKey`: `vuln`
- `phase`: `attack`
- `actorPerspective`: `attacker`
- `decision`: `accepted`
- `signal`: `idor-cross-user-order-exposed`

日志只保存对象摘要和归属判断，不保存完整敏感明细。
