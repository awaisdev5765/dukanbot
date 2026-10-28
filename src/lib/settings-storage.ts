import type { SettingsState } from "@/types/settings";
import {
  inviteTeamMember,
  loadSettingsFromDb,
  removeTeamMember,
  saveSettingsToDb,
} from "@/lib/settings-db";

export function defaultSettings(): SettingsState {
  return {
    plan: "starter",
    whatsapp_number: "",
    whatsapp_phone_number_id: "",
    team: [
      {
        id: "owner",
        email: "you@shop.pk",
        role: "owner",
        status: "active",
      },
    ],
    notifications: {
      new_order: true,
      escalation: true,
      daily_summary: false,
      email: true,
      whatsapp: true,
    },
    notify_email: "",
    notify_whatsapp_number: "",
    business_name: "Shop",
    updated_at: new Date().toISOString(),
  };
}

export async function loadSettings(): Promise<SettingsState> {
  try {
    return await loadSettingsFromDb();
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(state: SettingsState): Promise<SettingsState> {
  return saveSettingsToDb({
    plan: state.plan,
    whatsapp_number: state.whatsapp_number,
    notifications: state.notifications,
    notify_email: state.notify_email,
    notify_whatsapp_number: state.notify_whatsapp_number,
  });
}

export { inviteTeamMember, removeTeamMember };
