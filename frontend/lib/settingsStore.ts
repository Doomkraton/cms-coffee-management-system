import { create } from "zustand";
import { instanceSettingsApi } from "./api";

interface InstanceSettingsState {
  showCosts: boolean;
  currency: string;
  loaded: boolean;
  fetch: () => Promise<void>;
  setShowCosts: (v: boolean) => void;
  setCurrency: (v: string) => void;
}

export const useSettingsStore = create<InstanceSettingsState>((set) => ({
  showCosts: true,
  currency: "USD",
  loaded: false,

  fetch: async () => {
    try {
      const data = await instanceSettingsApi.get();
      set({ showCosts: data.show_costs, currency: data.currency, loaded: true });
    } catch {
      // Not authenticated yet — leave defaults, mark loaded so UI doesn't spin
      set({ loaded: true });
    }
  },

  setShowCosts: (v) => set({ showCosts: v }),
  setCurrency: (v) => set({ currency: v }),
}));
