import crypto from "crypto";
import bs58check from "bs58check";

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
      block.coinBaseAddress = this.getCoinbaseAddressFromBlockObject(block);
      return block;
    }

    // Get the current block count
    async getBlockCount() {
        return await this.call("getblockcount");
    }

    descToAddress(desc) {
      if (!desc || !desc.startsWith("pk(")) {
        throw new Error("Invalid or missing scriptPubKey.desc");
      }
    
      const pubKeyHex = desc.match(/^pk\(([0-9a-fA-F]+)\)/)?.[1];
      if (!pubKeyHex) {
        throw new Error("Public key not found in desc");
      }
    
      const pubKeyBuffer = Buffer.from(pubKeyHex, "hex");
      const sha256 = crypto.createHash("sha256").update(pubKeyBuffer).digest();
      const ripemd160 = crypto.createHash("ripemd160").update(sha256).digest();
      const payload = Buffer.concat([Buffer.from([0x00]), ripemd160]);
    
      return bs58check.encode(payload);
    }
  
    getCoinbaseAddressFromBlockObject(block) {
      const coinbaseTx = block?.tx?.[0];
    
      if (!coinbaseTx || !coinbaseTx.vout || coinbaseTx.vout.length === 0) {
        throw new Error("Coinbase transaction or output not found");
      }
    
      const desc = coinbaseTx.vout[0]?.scriptPubKey?.desc;
    
      if (!desc || !desc.startsWith("pk(")) {
        throw new Error("Invalid or missing scriptPubKey.desc");
      }
      
      const address = this.descToAddress(desc);

      console.log(`Coinbase address: ${address}`);
      return address;
    }
  }