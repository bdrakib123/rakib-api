const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Rakib API is UP ✅");
});

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
  console.log("Fetching avatar for UID:", uid);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return await Jimp.read(res.data);
}

// ---------- CONFIG ----------
const TEMPLATE_CONFIG = {
  pair: {
    bg: "pair.png",
    avatars: [
      { x: 880, y: 280, size: 260 },  // DP-1
      { x: 140, y: 280, size: 260 }   // DP-2
    ]
  },

  crush: {
    bg: "crush.png",
    avatars: [
      { x: 350, y: 250, size: 420 }
    ]
  }
};

// ---------- IMAGE MAKER ----------
async function makeImage(type, uids) {
  const config = TEMPLATE_CONFIG[type];
  if (!config) throw new Error("Unknown template type: " + type);

  const bgPath = path.join(__dirname, "image", config.bg);
  console.log("Loading BG:", bgPath);
  const bg = await Jimp.read(bgPath);

  const avatars = await Promise.all(uids.map(uid => getAvatar(uid)));

  for (let i = 0; i < config.avatars.length; i++) {
    const p = config.avatars[i];
    const avatar = avatars[i];

    console.log(`Placing avatar #${i + 1} at x=${p.x}, y=${p.y}, size=${p.size}`);
    avatar.resize(p.size, p.size);
    bg.composite(avatar, p.x, p.y);
  }

  return await bg.getBufferAsync(Jimp.MIME_PNG);
}

function sendStatic(res, fileName) {
  const imgPath = path.join(__dirname, "image", fileName);

  if (!fs.existsSync(imgPath)) {
    console.log("Static file not found:", imgPath);
    return res.status(404).json({ error: `${fileName} not found` });
  }

  const img = fs.readFileSync(imgPath);
  res.setHeader("Content-Type", "image/png");
  res.send(img);
}

// ---------- API ROUTES ----------

// Pair (2 UID)
app.get("/api/pair", async (req, res) => {
  const { uid1, uid2 } = req.query;
  console.log("GET /api/pair with:", uid1, uid2);

  if (!uid1 || !uid2) {
    console.log("Missing uid -> sending static pair.png");
    return sendStatic(res, "pair.png");
  }

  try {
    const buffer = await makeImage("pair", [uid1, uid2]);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("pair error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

// Crush (1 UID)
app.get("/api/crush", async (req, res) => {
  const { uid } = req.query;
  console.log("GET /api/crush with:", uid);

  if (!uid) {
    console.log("Missing uid -> sending static crush.png");
    return sendStatic(res, "crush.png");
  }

  try {
    const buffer = await makeImage("crush", [uid]);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("crush error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

// টেস্টের জন্য: fixed UID দিয়ে চেক
app.get("/api/testpair", async (req, res) => {
  try {
    // এখানে দুটো যে কোনো public UID দিয়ে আগে টেস্ট করে দেখতে পারো
    const buffer = await makeImage("pair", ["4", "4"]); // Mark Zuckerberg double 🤣
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("testpair error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
