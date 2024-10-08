const express = require("express");
const app = express();
const port = 3000;
const TMIO = require("trackmania.io");
const ordinal = require("ordinal-number-suffix");
const sql = require("@vercel/postgres");

async function getPlayerMMData(playerId) {
  await client.players.get(playerId).then(async (player) => {
    const mm = await player.matchmaking();
    console.log({
      division: mm.division.name,
      rank: mm.rank,
      score: mm.score,
    });
    return {
      division: mm.division.name,
      rank: mm.rank,
      score: mm.score,
    };
  });
}

function getChatText(data) {
  console.log(data);
  return `MM: ${data.mm?.division} (${ordinal(data.mm?.rank)}) with ${
    data.mm?.score
  } points | Campaign: ${ordinal(data.rank)} with ${data.points}`;
}

function getMMChatText(data) {
  return `${data.division.name} (${ordinal(data.rank)}) with ${
    data.score
  } points.`;
}

app.get("/api/ranks", (req, res) => {
  client = new TMIO.Client();
  if (req.query.text) {
    res.setHeader("Content-Type", "text/plain");
  } else {
    res.setHeader("Content-Type", "application/json");
  }
  res.setHeader("Cache-Control", "public, s-maxage=30");
  res.setHeader("CDN-Cache-Control", "public, s-max-age=30");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=30");

  let result = {};
  client.campaigns.currentSeason().then(async (campaign) => {
    let total = 100;
    while (total < 1000) {
      const leaderboard = await campaign.leaderboardLoadMore(100);
      leaderboard.slice(leaderboard.length - 100).forEach(async (top) => {
        if (top.playerName == req.query.player) {
          result = {
            player: top.playerName,
            rank: top.position,
            points: top.points,
            id: top._data.player.id,
          };
          total = 1000;
          const player = await client.players.get(result.id);
          const mm = await player.matchmaking();
          result.mm = {
            division: mm.division.name,
            rank: mm.rank,
            score: mm.score,
          };
          result.text = getChatText(result);
          if (req.query.text) {
            res.send(result.text);
          } else {
            res.send(result);
          }
          total = 1000;
        }
      });
      total += 100;
    }
  });
});

app.get("/api/mmrank", (req, res) => {
  client = new TMIO.Client();
  if (req.query.text) {
    res.setHeader("Content-Type", "text/plain");
  } else {
    res.setHeader("Content-Type", "application/json");
  }
  res.setHeader("Cache-Control", "public, s-maxage=30");
  res.setHeader("CDN-Cache-Control", "public, s-max-age=30");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=30");

  let result = {};
  client.players.get(req.query.player).then(async player => {
    const mm = await player.matchmaking();
    let text = getMMChatText(mm);
    res.send(text);
  })
});

app.get("/api/larsEmotes", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.setHeader("CDN-Cache-Control", "public, s-max-age=3600");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600");

  const response = await fetch(
    "https://7tv.io/v3/emote-sets/61df32674a3c173606dbf84e"
  );
  const customEmotes = await fetch(
    "https://gist.githubusercontent.com/davidmarcos98/36a872b47aef8ad1e77deb7d569b8a52/raw/f8ef7dfb1d3c7902f149039bf2bce645517c7557/gamblars.json"
  );
  let customData = await customEmotes.json();
  customData = customData.map((emote) => emote.toLowerCase());
  const data = await response.json();
  const emotes = [];
  data.emotes.forEach((emote) => {
    if (
      emote.name.toLowerCase().includes("lars") ||
      customData.includes(emote.name.toLowerCase())
    ) {
      emotes.push(emote.name);
    }
  });

  res.send(emotes);
});
app.get("/api/rmcrecords", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");

  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.setHeader("CDN-Cache-Control", "public, s-max-age=3600");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600");
  const rmc = await fetch(
    "https://www.flinkblog.de/RMC/api/rmc.php?year=2024&objective=author"
  );
  const rms = await fetch(
    "https://www.flinkblog.de/RMC/api/rms.php?year=2024&objective=author"
  );
  const rmcData = await rmc.json();
  const rmsData = await rms.json();

  res.send(
    `2024 Records: RMC: ${rmcData[0].displayName} with ${
      rmcData[0].goals
    } ATs and ${rmcData[0].belowGoals} golds. RMS: ${
      rmsData.length > 0
        ? `${rmsData[0].displayName} with ${rmsData[0].goals} ATs and ${rmsData[0].skips} skips.`
        : "None"
    }`
  );
});

app.get("/api/kackyfins", async (req, res) => {
  const pets = await sql.sql(`SELECT * FROM kackyfins;`);
  res.send(pets);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
