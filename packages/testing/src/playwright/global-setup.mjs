import { smokeChecks } from "../smoke/config.mjs";
import { waitForCheck } from "../smoke/http-checks.mjs";
import { ensureSmokeServices, stopManagedServices } from "../smoke/services.mjs";

export default async function globalSetup() {
  const managedServices = await ensureSmokeServices(smokeChecks);

  for (const check of smokeChecks) {
    await waitForCheck(check);
  }

  return async () => {
    stopManagedServices(managedServices);
  };
}
