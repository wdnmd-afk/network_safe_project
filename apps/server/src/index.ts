import "dotenv/config";

import { createApp } from "./app.js";
import { getServerPort } from "./config/runtime.js";
import { checkDatabaseHealth } from "./services/database-health.js";

const port = getServerPort();
const app = createApp({
  checkDatabaseHealth,
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
