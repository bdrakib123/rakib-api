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
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return await Jimp.read(res.data);
}

//সাইজ এড 2 ডিপি..... 


const TEMPLATE_CONFIG = {
  pair: {
    bg: "pair.png",
    avatars: [
      { x: 980, y: 200, size: 200 },  // DP-1
      { x: 140, y: 200, size: 200 }   // DP-2
    ]
  },

  //সাইজ এড ১ডিপি.....

  crush: {
    bg: "crush.png",
    avatars: [
      { x: 350, y: 250, size: 420 }   // Only 1 DP
    ]
  }
};

// এটার উপরে.....


async function makeImage(type, uids) {
  const config = TEMPLATE_CONFIG[type];

  if (!config) {
    throw new Error("Unknown template type: " + type);
  }

  const bgPath = path.join(__dirname, "image", config.bg);
  const bg = await Jimp.read(bgPath);
  
  const avatars = await Promise.all(uids.map(uid => getAvatar(uid)));

  for (let i = 0; i < config.avatars.length; i++) {
    const p = config.avatars[i];
    const avatar = avatars[i];

    avatar.resize(p.size, p.size);
    bg.composite(avatar, p.x, p.y);
  }

  return await bg.getBufferAsync(Jimp.MIME_PNG);
}

function sendStatic(res, fileName) {
  const imgPath = path.join(__dirname, "image", fileName);

  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ error: `${fileName} not found` });
  }

  const img = fs.readFileSync(imgPath);
  res.setHeader("Content-Type", "image/png");
  res.send(img);
}


// -------- Pair API (2 users) --------

app.get("/api/pair", async (req, res) => {
  const { uid1, uid2 } = req.query;

  
  if (!uid1 || !uid2) {
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

// -------- Crush API (1 user) --------

app.get("/api/crush", async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
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

// --------এটার উপরে....

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
