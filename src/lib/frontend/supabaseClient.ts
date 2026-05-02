import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabaseTypes";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error("Supabase URL and key must be provided");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
