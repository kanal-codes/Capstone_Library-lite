import pg from "pg";
import { pipeline } from "@xenova/transformers";

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_TRANSACTION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});

// downloads the model on the first run (about 25 MB), cached afterwards
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

const abstracts = [
  { title: "Inventory Management System for a Hardware Store", text: "A web system that tracks stock levels, supplier orders, and low-stock alerts for a small hardware store." },
  { title: "Stock Monitoring App for Retail Shops", text: "A mobile-friendly application that monitors product quantities and notifies owners when items run out." },
  { title: "Online Enrollment System for a Public High School", text: "A web platform that lets students submit enrollment forms and lets registrars verify requirements online." },
  { title: "Student Registration Portal with Document Tracking", text: "A portal where learners register for the school year and staff track submitted documents." },
  { title: "Crop Disease Detection Using Image Classification", text: "A machine learning model that identifies rice leaf diseases from photos taken by farmers." },
  { title: "Smart Irrigation Using IoT Soil Sensors", text: "An IoT system that reads soil moisture and automatically controls water pumps for vegetable farms." },
  { title: "Barangay Health Records Management System", text: "A system that stores patient records, immunization schedules, and visit history for a barangay health center." },
  { title: "Online Library Catalog with Book Reservation", text: "A web application for searching books and reserving them before visiting the school library." },
];

for (const a of abstracts) {
  const out = await embedder(`${a.title}. ${a.text}`, { pooling: "mean", normalize: true });
  const vector = Array.from(out.data);
  console.log(a.title, "->", vector.length, "numbers");

  await pool.query(
    "insert into abstracts (title, abstract_text, embedding) values ($1, $2, $3)",
    [a.title, a.text, JSON.stringify(vector)]
  );
}

await pool.end();