// index.js

import "dotenv/config";
import { MongoClient } from "mongodb";
import { BitcoinRPCClient } from "./BitcoinRPCClient.js";

const {
  BITCOIN_RPC_URL,
  BITCOIN_RPC_USER,
  BITCOIN_RPC_PASS,
  MONGO_URL,
  MONGO_DB_NAME,
  MONGO_COLLECTION_NAME,
  PROGRESS_ID,
  MAX_PROGRESS,
} = process.env;

const client = new BitcoinRPCClient({
  url: BITCOIN_RPC_URL,
  username: BITCOIN_RPC_USER,
  password: BITCOIN_RPC_PASS
});

const run = async () => {
  const mongoClient = new MongoClient(MONGO_URL);

  try {
    await mongoClient.connect();

    const db = mongoClient.db(MONGO_DB_NAME);
    const blocks = db.collection(MONGO_COLLECTION_NAME);
    const progressCollection = db.collection("progress");

    await progressCollection.updateOne(
      { _id: PROGRESS_ID },
      { $setOnInsert: { value: 0 } },
      { upsert: true }
    );

    const currentProgress = await progressCollection.findOne({ _id: PROGRESS_ID });
    if (currentProgress.value >= MAX_PROGRESS) {
      console.log(`⏹️ Limit reached. No processing done.`);
      return;
    }

    for (let i = currentProgress.value; i < MAX_PROGRESS; i++) {
      const block = await client.getBlockByHeight(i);

      console.log(`📦 Sync block #${i} : ${block.hash}`);

      await blocks.updateOne(
        { hash: block.hash },
        { $set: block },
        { upsert: true }
      );

      await progressCollection.updateOne(
        { _id: PROGRESS_ID },
        { $set: { value: i + 1 } }
      );
    }

    console.log("✅ Indexing finished");
  } catch (err) {
    console.error("❌ Error MongoDB or RPC :", err.message);
  } finally {
    await mongoClient.close();
  }
};

setTimeout(() => {
  run();
}, 10000);

setTimeout(() => {
  console.log("⏹️ Stopping process...");
}, 100000);