import { afterEach, describe, expect, it, vi } from "vitest";

import { submitCrlfInjectionPreview } from "../src/api/crlf-injection-lab";
import {
  attackCrlfFileName,
  normalCrlfDispositionType,
  normalCrlfFileName,
  normalCrlfHeaderTemplate,
} from "../src/labs/crlf-injection";

describe("crlf injection lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts header preview payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            headerTemplate: normalCrlfHeaderTemplate,
            dispositionType: normalCrlfDispositionType,
            fileNameLength: normalCrlfFileName.length,
            fileNamePreview: "inv***df",
            headers: [
              {
                name: "Content-Disposition",
                valuePreview: "attachment; filename=\"inv***df\"",
                source: "template",
                polluted: false,
              },
            ],
            inspection: {
              headerTemplateAllowed: true,
              dispositionTypeAllowed: true,
              fileNameLength: normalCrlfFileName.length,
              fileNamePreview: "inv***df",
              detectedControlChars: [],
              matchedControlledSample: false,
              virtualHeaderCount: 1,
              pollutedHeaderCount: 0,
            },
            signal: "crlf-injection-safe-header-previewed",
            decision: "accepted",
            message: "normal preview",
            nextStep: "try controlled sample",
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

    const result = await submitCrlfInjectionPreview(
      "vuln",
      "local-session-token",
      {
        headerTemplate: normalCrlfHeaderTemplate,
        fileName: normalCrlfFileName,
        dispositionType: normalCrlfDispositionType,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/crlf-injection/vuln/preview",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          headerTemplate: normalCrlfHeaderTemplate,
          fileName: normalCrlfFileName,
          dispositionType: normalCrlfDispositionType,
        }),
      },
    );
    expect(result.result.signal).toBe(
      "crlf-injection-safe-header-previewed",
    );
  });

  it("returns blocked response body for fixed variant controlled sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            headerTemplate: normalCrlfHeaderTemplate,
            dispositionType: normalCrlfDispositionType,
            fileNameLength: attackCrlfFileName.length,
            fileNamePreview: "controlled-crlf-file-name",
            headers: [],
            inspection: {
              headerTemplateAllowed: true,
              dispositionTypeAllowed: true,
              fileNameLength: attackCrlfFileName.length,
              fileNamePreview: "controlled-crlf-file-name",
              detectedControlChars: ["cr", "lf"],
              matchedControlledSample: true,
              virtualHeaderCount: 0,
              pollutedHeaderCount: 0,
            },
            signal: "crlf-injection-control-chars-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "control-chars-blocked",
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

    const result = await submitCrlfInjectionPreview(
      "fixed",
      "local-session-token",
      {
        headerTemplate: normalCrlfHeaderTemplate,
        fileName: attackCrlfFileName,
        dispositionType: normalCrlfDispositionType,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "crlf-injection-control-chars-blocked",
    );
  });
});
