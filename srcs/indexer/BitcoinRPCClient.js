export class BitcoinRPCClient {
    constructor({ url, username, password }) {
      this.url = url;
      this.authHeader =
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    }
  
    // Make a JSON-RPC call to the Bitcoin node
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
  
    // Get block by height (block number) 
    async getBlockByHeight(height, verbosity = 2) {
      const hash = await this.call("getblockhash", [height]);
      const block = await this.call("getblock", [hash, verbosity]);
      block.decodeCoinbase = this.decodeCoinbase(block);
      return block;
    }

    // Get the current block count
    async getBlockCount() {
        return await this.call("getblockcount");
    }
  
    // Decode the coinbase transaction hex to ASCII
    decodeCoinbase(block) {
    
      const coinbaseTx = block?.tx?.[0];
      const coinbaseInput = coinbaseTx?.vin?.[0];
  
      if (coinbaseInput?.coinbase) {
        const hex = coinbaseInput.coinbase;
        const decoded = Buffer.from(hex, "hex").toString("ascii");
        return decoded;
      } else {
        return null;
      }
    }
  }