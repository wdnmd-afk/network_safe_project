# shared

共享类型、实验元数据定义、公共常量与校验逻辑目录。

## 当前能力

- `@network-safe/shared/lab-metadata`
  - 实验元数据状态、模式、风险等级、难度枚举
  - `LabMetadata` 类型声明
  - `validateLabMetadata` 运行时校验

## 验证

```powershell
pnpm --filter @network-safe/shared test
```
