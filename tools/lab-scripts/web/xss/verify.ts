import { pathToFileURL } from "node:url";

export const xssSamplePayload =
  '<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>';

export const xssVerificationPlan = {
  labKey: "web.xss",
  scope: "localhost-only",
  safeBoundary:
    "仅验证本项目本机页面的渲染差异，不访问外部目标，不执行真实脚本 payload。",
  variants: [
    {
      key: "vuln",
      route: "/labs/web/xss/vuln",
      action: "填入样例后提交留言",
      expectedSignal: "页面生成 data-xss-lab-signal=\"xss\" 对应的黄色模拟信号。",
    },
    {
      key: "fixed",
      route: "/labs/web/xss/fixed",
      action: "填入同一样例后提交留言",
      expectedSignal:
        "页面原样显示 HTML 字符串，不生成 data-xss-lab-signal DOM 标记。",
    },
  ],
};

export function getXssVerificationPlan() {
  return {
    samplePayload: xssSamplePayload,
    ...xssVerificationPlan,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getXssVerificationPlan(), null, 2));
}
