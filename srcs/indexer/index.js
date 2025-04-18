// index.js

class BitcoinRPCClient {
  constructor({ url, username, password }) {
    this.url = url;
    this.authHeader =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
  }

  async call(method, params = []) {
    const payload = {
      jsonrpc: "1.0",
      id: "js-client",
      method,
      params
    };

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Authorization": this.authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  async getBlockByHeight(height, verbosity = 2) {
    const hash = await this.call("getblockhash", [height]);
    const block = await this.call("getblock", [hash, verbosity]);

    this.decodeCoinbase(block);
    return block;
  }

  decodeCoinbase(block) {
    const coinbaseTx = block?.tx?.[0];
    const coinbaseInput = coinbaseTx?.vin?.[0];

    if (coinbaseInput?.coinbase) {
      const hex = coinbaseInput.coinbase;
      const decoded = Buffer.from(hex, "hex").toString("ascii");
      coinbaseInput.coinbase_ascii = decoded;
    }
  }

  async getBlockCount() {
    return await this.call("getblockcount");
  }
}

// ---------- Utilisation ----------

const client = new BitcoinRPCClient({
  url: "http://bitcoind:8332/",
  username: "bitcoin",
  password: "bitcoin"
});

(async () => {
  try {
    const max = 1000; // Ou await client.getBlockCount();

    for (let i = 0; i < max; i++) {
      const block = await client.getBlockByHeight(i);
      console.log(`📦 Bloc ${i}`);
      console.dir(block, { depth: null });
      console.log("\n---\n");
    }

    console.log("✅ Terminé !");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
  }
})();