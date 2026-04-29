import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pfpdakjkuzennwaizypr.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGRha2prdXplbm53YWl6eXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTExOTAsImV4cCI6MjA5Mjk4NzE5MH0.fl-WC9A6P6oLewvW_fUBHX-jt78pbi9UrnA2rsmktYk";

export const supabase = createClient(supabaseUrl, supabaseKey);
