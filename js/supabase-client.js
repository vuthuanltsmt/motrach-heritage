import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://vcstrvqubskhnvococjs.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Pkv5q3IjDqhGCApiE8xr2Q_rURmjGMw";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);