import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_TRANSACTION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});

const res = await pool.query("select count(*) from abstracts");
console.log(res.rows);
await pool.end();