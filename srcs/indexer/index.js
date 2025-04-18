// index.js

const rpcUser = "bitcoin";
const rpcPassword = "bitcoin";
const url = "http://bitcoind:8332/";

const payload = {
  jsonrpc: "1.0",
  id: "js-client",
  method: "getblockhash",
  params: [2]
};

const headers = {
  "Content-Type": "text/plain",
  "Authorization": "Basic " + Buffer.from(`${rpcUser}:${rpcPassword}`).toString("base64")
};

(async () => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error("RPC Error:", data.error);
    } else {
      console.log("Block hash:", data.result);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
})();