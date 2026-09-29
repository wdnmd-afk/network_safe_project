import { ensureE2eServices, stopManagedServices } from "./services.mjs";

export default async function globalSetup() {
  const managedServices = await ensureE2eServices();

  return async () => {
    stopManagedServices(managedServices);
  };
}
