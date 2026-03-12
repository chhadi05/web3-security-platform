const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.ETHERSCAN_API_KEY;
const PORT = process.env.PORT || 5000;

// Home Route
app.get("/", (req, res) => {
  res.send("ZenithCipher Web3 Security Scanner Running");
});

// Wallet Scanner API
app.get("/api/scan/:wallet", async (req, res) => {

  const wallet = req.params.wallet;

  // Wallet address validation
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletRegex.test(wallet)) {
    return res.status(400).json({ error: "Invalid Ethereum wallet address" });
  }

  try {

   const txURL = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`;

   const tokenURL = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${wallet}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`;

   const balanceURL = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${wallet}&tag=latest&apikey=${API_KEY}`;

const txResponse = await axios.get(txURL);
const tokenResponse = await axios.get(tokenURL);
const balanceResponse = await axios.get(balanceURL);

const balanceWei = balanceResponse.data.result || 0;
const balanceETH = balanceWei / 1e18;

const transactions = Array.isArray(txResponse.data.result)
  ? txResponse.data.result
  : [];

const tokens = Array.isArray(tokenResponse.data.result)
  ? tokenResponse.data.result
  : [];

const txCount = transactions.length;
const tokenTransfers = tokens.length;

let contractInteractions = 0;

transactions.forEach(tx => {
  if (tx.input !== "0x") {
    contractInteractions++;
  }
});

// ---------- Consolidated Risk Engine ----------

let riskScore = 0;
let warnings = [];

// High activity
if (txCount > 200) {
  riskScore += 25;
  warnings.push("High transaction activity");
}

// Contract interactions
if (contractInteractions > 50) {
  riskScore += 25;
  warnings.push("Frequent smart contract interaction");
}

// Token spam detection
if (tokenTransfers > 100) {
  riskScore += 30;
  warnings.push("Large number of token transfers (possible airdrop spam)");
}

// Suspicious Bot Activity
if (txCount > 500) {
  riskScore += 40;
  warnings.push("Possible trading bot activity");
}

// Burner Wallet Detection
if (txCount < 3 && balanceETH < 0.01) {
  riskScore += 20;
  warnings.push("Low activity wallet (possible burner)");
}

// Token Farming
if (tokenTransfers > 300) {
  riskScore += 40;
  warnings.push("Suspicious token farming activity");
}

// Risk level calculation
let riskLevel = "Low";

if (riskScore > 60) {
  riskLevel = "High";
} else if (riskScore > 30) {
  riskLevel = "Medium";
}

let reputationScore = 100;

// reduce score based on risk
reputationScore -= riskScore;

// normalize
if (reputationScore < 0) reputationScore = 0;
if (reputationScore > 100) reputationScore = 100;

let scamTokens = [];

tokens.forEach(token => {

    const name = token.tokenName ? token.tokenName.toLowerCase() : "";
    const symbol = token.tokenSymbol ? token.tokenSymbol.toLowerCase() : "";

    if (
        name.includes("claim") ||
        name.includes("reward") ||
        name.includes("airdrop") ||
        symbol.includes("claim")
    ) {
        scamTokens.push({
            name: token.tokenName,
            symbol: token.tokenSymbol
        });
    }

});

// Response
res.json({
wallet: wallet,
balanceETH: balanceETH,
transactions: txCount,
tokenTransfers: tokenTransfers,
contractInteractions: contractInteractions,
riskScore: riskScore,
reputationScore: reputationScore,
riskLevel: riskLevel,
warnings: warnings,
scamTokens: scamTokens,
recentTransactions: transactions.slice(0, 50)

});

  } catch (error) {

    console.error("Scanner Error:", error.message);

    res.status(500).json({
      error: "Failed to analyze wallet"
    });

  }

});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

