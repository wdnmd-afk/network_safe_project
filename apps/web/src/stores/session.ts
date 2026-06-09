import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({
    displayName: "林安",
    membership: "Pro",
    riskNoticeCount: 3,
  }),
});
