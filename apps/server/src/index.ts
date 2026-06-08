import "dotenv/config";

import { createApp } from "./app.js";
import { checkDatabaseHealth } from "./services/database-health.js";

const port = Number(process.env.PORT || 3000);
const app = createApp({
  checkDatabaseHealth,
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
