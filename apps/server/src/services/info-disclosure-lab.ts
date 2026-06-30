export type InfoDisclosureVariantKey = "vuln" | "fixed";

export type InfoDisclosureSignal =
  | "info-disclosure-public-report-returned"
  | "info-disclosure-debug-data-exposed"
  | "info-disclosure-debug-data-blocked"
  | "info-disclosure-report-not-found";

export type InfoDisclosureStatus = "ok" | "blocked" | "not-found";

export type InfoDisclosureInput = {
  userId: string;
  variantKey: InfoDisclosureVariantKey;
  reportKey: string;
};

export type InfoDisclosureField = {
  label: string;
  value: string;
  sensitive: boolean;
};

export type InfoDisclosureReport = {
  key: string;
  title: string;
  reportType: "public" | "debug";
  summary: string;
  fields: InfoDisclosureField[];
  isSensitive: boolean;
};

export type InfoDisclosureInspection = {
  normalizedReportKey: string;
  requestedSensitiveReport: boolean;
  allowedPublicReport: boolean;
  exposedFieldCount: number;
  reportKeyLength: number;
};

export type InfoDisclosureResult = {
  status: InfoDisclosureStatus;
  variantKey: InfoDisclosureVariantKey;
  reportKey: string;
  inspection: InfoDisclosureInspection;
  report: InfoDisclosureReport | null;
  signal: InfoDisclosureSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type InfoDisclosureLabService = {
  readReport(input: InfoDisclosureInput): Promise<InfoDisclosureResult>;
};

const publicReportKeys = new Set(["public-status"]);

const virtualReports = new Map<string, InfoDisclosureReport>([
  [
    "public-status",
    {
      key: "public-status",
      title: "SafeMart 公开服务状态",
      reportType: "public",
      summary: "公开报告：展示普通用户可见的服务状态和客服入口摘要。",
      fields: [
        {
          label: "服务状态",
          value: "在线",
          sensitive: false,
        },
        {
          label: "客服入口",
          value: "/support",
          sensitive: false,
        },
        {
          label: "公开检查项",
          value: "商品浏览、订单查询、客服留言",
          sensitive: false,
        },
      ],
      isSensitive: false,
    },
  ],
  [
    "debug-diagnostics",
    {
      key: "debug-diagnostics",
      title: "内部调试诊断报告",
      reportType: "debug",
      summary:
        "内部调试报告：内容均为教学占位，用于观察调试信息被普通用户读取的风险。",
      fields: [
        {
          label: "堆栈摘要",
          value:
            "DemoError: simulated checkout diagnostic failure at SafeMartOrderService.preview()",
          sensitive: true,
        },
        {
          label: "内部配置键名",
          value:
            "PAYMENT_GATEWAY_MODE, SESSION_COOKIE_NAME, INTERNAL_TRACE_SAMPLE",
          sensitive: true,
        },
        {
          label: "演示 token 形态",
          value: "demo-token-shape: header.payload.signature（占位，不是真实 token）",
          sensitive: true,
        },
        {
          label: "内部路径占位",
          value: "C:\\network-safe-demo\\server\\src\\services\\orders.ts",
          sensitive: true,
        },
      ],
      isSensitive: true,
    },
  ],
]);

function normalizeReportKey(reportKey: string) {
  return reportKey.trim().toLowerCase();
}

function createInspection(
  reportKey: string,
  report: InfoDisclosureReport | null,
): InfoDisclosureInspection {
  const normalizedReportKey = normalizeReportKey(reportKey);

  return {
    normalizedReportKey,
    requestedSensitiveReport: Boolean(report?.isSensitive),
    allowedPublicReport: publicReportKeys.has(normalizedReportKey),
    exposedFieldCount: report?.fields.length ?? 0,
    reportKeyLength: reportKey.length,
  };
}

export function createInfoDisclosureLabService(): InfoDisclosureLabService {
  return {
    async readReport(input) {
      const reportKey = input.reportKey.trim();
      const normalizedReportKey = normalizeReportKey(reportKey);
      const report = virtualReports.get(normalizedReportKey) ?? null;
      const inspection = createInspection(reportKey, report);

      if (!report) {
        return {
          status: "not-found",
          variantKey: input.variantKey,
          reportKey,
          inspection,
          report: null,
          signal: "info-disclosure-report-not-found",
          decision: "failed",
          message: "虚拟诊断报告不存在，实验没有读取真实系统信息。",
          nextStep: "填入公开报告或调试报告样例，再观察漏洞版与修复版差异。",
        };
      }

      if (input.variantKey === "fixed" && report.isSensitive) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          reportKey,
          inspection,
          report: null,
          signal: "info-disclosure-debug-data-blocked",
          decision: "blocked",
          message: "修复版禁止普通用户读取调试诊断报告，已返回通用阻断结果。",
          nextStep: "切回漏洞版提交同样 reportKey，观察内部调试信息如何被暴露。",
          blockedReason: "debug-report-not-public",
        };
      }

      if (report.isSensitive) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          reportKey,
          inspection,
          report,
          signal: "info-disclosure-debug-data-exposed",
          decision: "accepted",
          message: "漏洞版把内部调试报告返回给普通用户，教学占位信息被暴露。",
          nextStep: "切到修复版提交同样 reportKey，观察错误信息如何收敛。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        reportKey,
        inspection,
        report,
        signal: "info-disclosure-public-report-returned",
        decision: "accepted",
        message: "公开服务状态报告读取成功，未包含内部调试字段。",
        nextStep: "填入调试报告样例，观察漏洞版和修复版对敏感报告的差异。",
      };
    },
  };
}
