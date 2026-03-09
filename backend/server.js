const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("Web3 Security Platform Backend Running");
});

app.get("/scan/:wallet", (req, res) => {

    const wallet = req.params.wallet;

    res.json({
        wallet: wallet,
        riskScore: 65,
        warnings: [
            "Suspicious token transfers",
            "Unknown contract interaction"
        ]
    });

});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});