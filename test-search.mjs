import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const out = await embedder("an app to track store inventory", { pooling: "mean", normalize: true });
const vector = Array.from(out.data);

// attempt 1: through supabase-js (goes via PostgREST)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const viaRpc = await supabase.rpc("match_abstracts", { query_embedding: vector, match_count: 3 });
console.log("supabase-js:", viaRpc.data, viaRpc.error);

// attempt 2: direct pg connection
const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_TRANSACTION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});
const viaPg = await pool.query("select * from match_abstracts($1::vector, $2)", [JSON.stringify(vector), 3]);
console.log("pg:", viaPg.rows.map((r) => `${r.similarity.toFixed(3)}  ${r.title}`));
await pool.end();
