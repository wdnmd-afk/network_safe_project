import { afterEach, describe, expect, it, vi } from "vitest";

import { submitFileUpload } from "../src/api/file-upload-lab";

describe("file upload lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts simulated upload payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            fileName: "avatar.png",
            contentType: "image/png",
            inspection: {
              extension: ".png",
              allowedExtension: true,
              allowedContentType: true,
              detectedExecutableContent: false,
              contentLength: 40,
            },
            storedAsset: {
              originalName: "avatar.png",
              storedName: "vuln-1-avatar.png",
              storagePath: "/simulated-uploads/vuln/vuln-1-avatar.png",
              publicUrl: "/uploads/vuln/vuln-1-avatar.png",
            },
            signal: "file-upload-normal-image-stored",
            decision: "accepted",
            message: "normal upload",
            nextStep: "try attack sample",
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

    const result = await submitFileUpload("vuln", "local-session-token", {
      fileName: "avatar.png",
      contentType: "image/png",
      contentText: "PNG image bytes for local learning sample",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/file-upload/vuln/upload",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          fileName: "avatar.png",
          contentType: "image/png",
          contentText: "PNG image bytes for local learning sample",
        }),
      },
    );
    expect(result.result.signal).toBe("file-upload-normal-image-stored");
  });

  it("returns blocked response body for fixed variant dangerous upload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            fileName: "shell.php",
            contentType: "application/x-php",
            inspection: {
              extension: ".php",
              allowedExtension: false,
              allowedContentType: false,
              detectedExecutableContent: true,
              contentLength: 38,
            },
            storedAsset: null,
            signal: "file-upload-validation-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "review validation",
            blockedReason: "file-validation-failed",
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

    const result = await submitFileUpload("fixed", "local-session-token", {
      fileName: "shell.php",
      contentType: "application/x-php",
      contentText: "<?php echo 'local controlled sample'; ?>",
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("file-upload-validation-blocked");
  });
});
