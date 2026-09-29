import { createAdminApp } from "./app.js";
import { loadServerConfig } from "./config.js";

const config = loadServerConfig();

const app = createAdminApp({
  tokenSecret: config.tokenSecret,
  tokenTtlMs: config.tokenTtlMs,
  mainSiteOrigin: config.mainSiteOrigin,
});

app.listen(config.port, config.host, () => {
  console.log(
    `admin server listening on http://${config.host}:${config.port} (env=${config.appEnv})`,
  );
  console.log(`main site origin: ${config.mainSiteOrigin}`);
});
