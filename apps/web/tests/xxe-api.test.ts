import { afterEach, describe, expect, it, vi } from "vitest";

import { submitXxeImport } from "../src/api/xxe-lab";
import {
  attackXxeVirtualEntitySample,
  normalXxeImportKind,
} from "../src/labs/xxe";

describe("xxe lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts XML import payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            importKind: "invoice-preview",
            preview: {
              title: "XML 发票导入预览",
              fields: [
                {
                  key: "note",
                  label: "备注",
                  value: "虚拟内部说明：仅用于 XXE 学习复盘",
                  fromVirtualEntity: true,
                },
              ],
            },
            inspection: {
              xmlLength: attackXxeVirtualEntitySample.length,
              containsDoctype: true,
              declaredEntityNames: ["labSecret"],
              referencedEntityNames: ["labSecret"],
              entitySourceTypes: ["virtual-file"],
              matchedControlledSample: true,
              unknownEntityCount: 0,
            },
            signal: "xxe-internal-resource-exposed",
            decision: "accepted",
            message: "controlled virtual entity resolved",
            nextStep: "compare fixed",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitXxeImport("vuln", "local-session-token", {
      importKind: normalXxeImportKind,
      xmlDocument: attackXxeVirtualEntitySample,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/xxe/vuln/import", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        importKind: normalXxeImportKind,
        xmlDocument: attackXxeVirtualEntitySample,
      }),
    });
    expect(result.result.signal).toBe("xxe-internal-resource-exposed");
  });

  it("returns blocked response body for fixed variant controlled sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            importKind: "invoice-preview",
            preview: {
              title: "XML 发票导入预览",
              fields: [],
            },
            inspection: {
              xmlLength: attackXxeVirtualEntitySample.length,
              containsDoctype: true,
              declaredEntityNames: ["labSecret"],
              referencedEntityNames: ["labSecret"],
              entitySourceTypes: ["virtual-file"],
              matchedControlledSample: true,
              unknownEntityCount: 0,
            },
            signal: "xxe-doctype-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "doctype-or-entity-disabled",
          },
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitXxeImport("fixed", "local-session-token", {
      importKind: normalXxeImportKind,
      xmlDocument: attackXxeVirtualEntitySample,
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("xxe-doctype-blocked");
  });
});
