import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

export const SUPABASE_URL = "https://gqxrbpqrmnflmecuqryp.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJicHFybW5mbG1lY3VxcnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzEzNzAsImV4cCI6MjA3NTI0NzM3MH0.DerdcHMv_JVoG6M75_hOrh64oui51ItgaOstRaayWbs";


let currentUserId = null;

function createSupabaseClient(userId) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        "x-user-id": userId || "",
      },
    },
  });
}

export let supabase = createSupabaseClient(currentUserId);

export function setAppUserId(userId) {
  currentUserId = userId;
  supabase = createSupabaseClient(userId);
  console.log("🔑 Supabase header x-user-id set:", userId);
}

export function clearAppUserId() {
  currentUserId = null;
  supabase = createSupabaseClient(null);
  console.log("🚪 Supabase header cleared");
}
