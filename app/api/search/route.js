import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_TRANSACTION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export async function POST(request) {
  const { embedding } = await request.json();

  if (!Array.isArray(embedding) || embedding.length !== 384) {
    return Response.json({ error: "Invalid embedding" }, { status: 400 });
  }

  const result = await pool.query(
    "select * from match_abstracts($1::vector, $2)",
    [JSON.stringify(embedding), 5]
  );

  return Response.json({ results: result.rows });
}