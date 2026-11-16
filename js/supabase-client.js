import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://vcstrvqubskhnvococjs.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Pkv5q3IjDqhGCApiE8xr2Q_rURmjGMw";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Phiên đăng nhập của độc giả dùng khóa lưu trữ riêng.
export function createReaderClient() {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            storageKey: "motrach-reader-auth-v1",
            flowType: "pkce"
        }
    });
}
