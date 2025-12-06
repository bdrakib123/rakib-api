const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

function sendImage(res, fileName) {
  const imgPath = path.join(__dirname, "image", fileName);

  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ error: `${fileName} not found on server` });
  }

  const img = fs.readFileSync(imgPath);
  res.setHeader("Content-Type", "image/png");
  res.send(img);
}

// টেস্ট করার জন্য
app.get("/api", (req, res) => {
  res.json({ message: "Rakib API is working ✅" });
});

// pair image API
app.post("/api/pair", (req, res) => {
  sendImage(res, "pair.png");
});

// crush image API
app.post("/api/crush", (req, res) => {
  sendImage(res, "crush.png");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
