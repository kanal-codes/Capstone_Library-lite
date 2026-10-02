"use client";

import { useState } from "react";

let embedderPromise = null;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    );
  }
  return embedderPromise;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setStatus("Loading model and searching...");
      const embedder = await getEmbedder();
      const out = await embedder(query, { pooling: "mean", normalize: true });

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding: Array.from(out.data) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.results);
      setStatus(data.results.length ? "" : "No results");
    } catch (err) {
      setStatus("Something went wrong: " + err.message);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Capstone Library Lite</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your capstone idea..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
          Search
        </button>
      </form>
      {status && <p className="text-sm text-gray-500 mb-4">{status}</p>}
      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="flex justify-between">
              <h2 className="font-medium">{r.title}</h2>
              <span className="text-sm">{(r.similarity * 100).toFixed(1)}%</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{r.abstract_text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}