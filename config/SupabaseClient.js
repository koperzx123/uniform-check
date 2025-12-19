import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

export const SUPABASE_URL = "https://gqxrbpqrmnflmecuqryp.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJicHFybW5mbG1lY3VxcnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzEzNzAsImV4cCI6MjA3NTI0NzM3MH0.DerdcHMv_JVoG6M75_hOrh64oui51ItgaOstRaayWbs";

// ===============================
// เก็บ user id ปัจจุบัน
// ===============================
let CURRENT_USER_ID = null;

// ===============================
// ฟังก์ชันสร้าง supabase client ใหม่ (สำคัญ!)
// ===============================
function createSupabase(userId) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        // ต้องเป็น string เสมอ
        "x-user-id": userId?.toString?.() || "",
      },
    },
  });
}

// ===============================
// client เริ่มต้น (ยังไม่มี userId)
// ===============================
export let supabase = createSupabase(CURRENT_USER_ID);

// ===============================
// ใช้ตอน Login / หลัง RPC app_me
// ===============================
export function setAppUserId(id) {
  CURRENT_USER_ID = id?.toString?.() || "";
  supabase = createSupabase(CURRENT_USER_ID);

  console.log("🔑 SET USER ID =", CURRENT_USER_ID);
}

// ===============================
// ใช้ตอน logout
// ===============================
export function clearAppUserId() {
  CURRENT_USER_ID = null;
  supabase = createSupabase("");

  console.log("🚪 CLEAR USER ID");
}
