import { describe, expect, it } from "vitest";

import type { PortScanResult } from "../src/api/port-scan-lab";
import {
  createPortScanLearningProgress,
  createPortScanVerificationRecord,
  defaultPortScanProfile,
  defaultPortScanTargetKey,
  formatPortScanSignal,
  getPortScanTargetObservationRows,
  getPortScanVariantConfig,
  portScanProfileOptions,
  portScanReviewChecklist,
  portScanTargetOptions,
} from "../src/labs/port-scan";

describe("端口扫描纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getPortScanVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "虚拟资产暴露管理端口、维护端口或调试入口",
    });
    expect(getPortScanVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "最小暴露面、管理面收敛和内部服务隔离",
    });
  });

  it("暴露固定目标和固定观察模式", () => {
    expect(defaultPortScanTargetKey).toBe("admin-node");
    expect(defaultPortScanProfile).toBe("surface-review");
    expect(portScanTargetOptions.map((item) => item.key)).toEqual([
      "office-gateway",
      "admin-node",
      "hardened-service",
    ]);
    expect(portScanProfileOptions.map((item) => item.key)).toEqual([
      "quick-observe",
      "surface-review",
    ]);
  });

  it("为不同变体生成目标观察说明", () => {
    const vulnerableRows = getPortScanTargetObservationRows("vuln");
    const fixedRows = getPortScanTargetObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(3);
    expect(fixedRows).toHaveLength(3);
    expect(vulnerableRows[1]).toMatchObject({
      key: "admin-node",
      title: "虚拟后台管理节点",
    });
    expect(vulnerableRows[1]!.focus).toContain("高价值管理面");
    expect(fixedRows[1]!.focus).toContain("收敛到受控范围");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createPortScanLearningProgress(getPortScanVariantConfig("vuln")),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 端口扫描漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: PortScanResult = {
      status: "ok",
      variantKey: "vuln",
      targetKey: defaultPortScanTargetKey,
      scanProfile: defaultPortScanProfile,
      target: {
        targetKey: defaultPortScanTargetKey,
        title: "虚拟后台管理节点",
        profile: "exposed",
        description: "virtual target",
      },
      ports: [],
      summary: {
        virtualPortCount: 4,
        openPortCount: 4,
        restrictedPortCount: 0,
        highRiskPortCount: 3,
        exposureScore: 155,
        matchedControlledSample: true,
      },
      signal: "port-scan-management-surface-visible",
      decision: "accepted",
      message: "management surface visible",
      nextStep: "compare fixed",
    };
    const fixedResult: PortScanResult = {
      ...vulnerableResult,
      variantKey: "fixed",
      summary: {
        virtualPortCount: 3,
        openPortCount: 0,
        restrictedPortCount: 3,
        highRiskPortCount: 0,
        exposureScore: 24,
        matchedControlledSample: true,
      },
      signal: "port-scan-surface-reduced",
      message: "surface reduced",
    };

    expect(
      createPortScanVerificationRecord(
        getPortScanVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版展示了虚拟资产管理面或高风险端口公开暴露信号。",
      details: {
        signal: "port-scan-management-surface-visible",
        targetKey: "admin-node",
        scanProfile: "surface-review",
        virtualPortCount: 4,
        openPortCount: 4,
        restrictedPortCount: 0,
        highRiskPortCount: 3,
        exposureScore: 155,
      },
    });
    expect(
      createPortScanVerificationRecord(
        getPortScanVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版展示了虚拟资产公开端口和高风险端口收敛效果。",
      details: {
        signal: "port-scan-surface-reduced",
        targetKey: "admin-node",
        scanProfile: "surface-review",
        virtualPortCount: 3,
        openPortCount: 0,
        restrictedPortCount: 3,
        highRiskPortCount: 0,
        exposureScore: 24,
      },
    });
  });

  it("静态文案保持固定目标和无真实扫描边界", () => {
    const combined = JSON.stringify({
      configs: [
        getPortScanVariantConfig("vuln"),
        getPortScanVariantConfig("fixed"),
      ],
      targets: portScanTargetOptions,
      profiles: portScanProfileOptions,
      checklist: portScanReviewChecklist,
    });

    expect(formatPortScanSignal("port-scan-surface-reduced")).toBe(
      "修复版暴露面已收敛",
    );
    expect(combined).toContain("固定虚拟资产");
    expect(combined).not.toContain("://");
    expect(combined).not.toContain("LAB_CONTROLLED");
    expect(combined).not.toContain("nmap");
  });
});
