import "dotenv/config";
import { MongoClient } from "mongodb";

const {
  MONGO_URL,
  MONGO_DB_NAME,
  MONGO_COLLECTION_NAME
} = process.env;

const run = async () => {
  const mongo = new MongoClient(MONGO_URL);
  try {
    await mongo.connect();
    const db = mongo.db(MONGO_DB_NAME);
    const blocks = db.collection(MONGO_COLLECTION_NAME);
    const addresses = db.collection("addresses");

    const cursor = blocks.find({});
    while (await cursor.hasNext()) {
      const block = await cursor.next();
      for (const tx of block.tx || []) {
        // Sorties : ajouts de BTC
        for (const vout of tx.vout || []) {
          const value = vout.value;
          const script = vout.scriptPubKey;
          if (!script?.addresses) continue;

          for (const addr of script.addresses) {
            await addresses.updateOne(
              { _id: addr },
              { $inc: { balance: value } },
              { upsert: true }
            );
          }
        }

        // Entrées : retraits de BTC
        for (const vin of tx.vin || []) {
          if (vin.coinbase || !vin.txid) continue;

          const prevTxDoc = await blocks.findOne({ "tx.txid": vin.txid });
          if (!prevTxDoc) continue;
          const prevTx = prevTxDoc.tx.find(t => t.txid === vin.txid);
          if (!prevTx || !prevTx.vout[vin.vout]) continue;

          const prevOutput = prevTx.vout[vin.vout];
          const value = prevOutput.value;
          const script = prevOutput.scriptPubKey;

          if (!script?.addresses) continue;

          for (const addr of script.addresses) {
            await addresses.updateOne(
              { _id: addr },
              { $inc: { balance: -value } },
              { upsert: true }
            );
          }
        }
      }
    }

    console.log("✅ Address parsing complete");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongo.close();
  }
};

run();