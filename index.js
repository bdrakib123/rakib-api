const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Rakib API is UP ✅");
});

function sendImage(res, fileName) {
  const imgPath = path.join(__dirname, "image", fileName);
  console.log("Sending image from:", imgPath);

  if (!fs.existsSync(imgPath)) {
    console.log("File not found:", imgPath);
    return res.status(404).json({ error: `${fileName} not found on server` });
  }

  const img = fs.readFileSync(imgPath);
  res.setHeader("Content-Type", "image/png");
  res.send(img);
}

// pair API → POST
app.post("/api/pair", (req, res) => {
  sendImage(res, "pair.png");
});

// crush API → POST
app.post("/api/crush", (req, res) => {
  sendImage(res, "crush.png");
});

// 👉 ব্রাউজারে টেস্ট করার জন্য GET রাউটও
app.get("/api/pair", (req, res) => {
  sendImage(res, "pair.png");
});

app.get("/api/crush", (req, res) => {
  sendImage(res, "crush.png");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
