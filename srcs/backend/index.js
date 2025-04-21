import "dotenv/config";
import express from "express";
import { MongoClient } from "mongodb";

const {
  MONGO_URL,
  MONGO_DB_NAME,
  MONGO_COLLECTION_NAME
} = process.env;

const app = express();
const PORT = process.env.PORT || 4000;

const client = new MongoClient(MONGO_URL);

app.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing search query 'q'" });
  }

  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    const blocks = db.collection(MONGO_COLLECTION_NAME);

    let query;

    if (/^[0-9]+$/.test(q)) {
      // Recherche par height (entier)
      query = { height: parseInt(q, 10) };
    } else if (/^[a-fA-F0-9]{64}$/.test(q)) {
      // Recherche par hash exact
      query = { hash: q };
    } else {
      // Recherche par contenu partiel du coinbase (champ decodeCoinbase)
      query = { decodeCoinbase: { $regex: q, $options: "i" } };
    }

    const results = await blocks.find(query).limit(10).toArray();

    if (results.length === 0) {
      return res.status(404).json({ message: "No matching block found." });
    }

    return res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Search API running at http://localhost:${PORT}`);
});