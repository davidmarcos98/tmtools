const express = require('express')
const app = express()
const port = 3000
const TMIO = require('trackmania.io');
const ordinal = require('ordinal-number-suffix')
const sql = require('@vercel/postgres');



async function getPlayerMMData(playerId){
    await client.players.get(playerId).then(async player=>{
        const mm = await player.matchmaking();
        console.log({
            division: mm.division.name,
            rank: mm.rank,
            score: mm.score
        })
        return {
            division: mm.division.name,
            rank: mm.rank,
            score: mm.score
        }
    });
}

function getChatText(data){
    console.log(data)
    return `MM: ${data.mm?.division} (${ordinal(data.mm?.rank)}) with ${data.mm?.score} points | Campaign: ${ordinal(data.rank)} with ${data.points}`
}

app.get('/api/ranks', (req, res) => {
    client = new TMIO.Client();
    if(req.query.text){
        res.setHeader('Content-Type', 'text/plain')
    } else {
        res.setHeader('Content-Type', 'application/json');
    }
    res.setHeader('Cache-Control', 'public, s-maxage=180');
    res.setHeader('CDN-Cache-Control', 'public, s-max-age=180');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=180');

    let result = {}
    console.log('AAAA')
    client.campaigns.currentSeason().then(async campaign=>{
        let total = 100;
        while (total < 1000){
            console.log(total)
            console.log('hey')
            const leaderboard = await campaign.leaderboardLoadMore(100);
            leaderboard.slice(leaderboard.length - 100).forEach(async top=>{
                if (top.playerName == req.query.player){
                    result = {
                        player: top.playerName,
                        rank: top.position,
                        points: top.points,
                        id: top._data.player.id
                    }
                    total = 1000;
                    const player = await client.players.get(result.id);
                    const mm = await player.matchmaking();
                    result.mm = {
                        division: mm.division.name,
                        rank: mm.rank,
                        score: mm.score
                    }
                    result.text = getChatText(result);
                    if(req.query.text){
                        res.send(result.text)
                    } else {
                        res.send(result)
                    }
                    total = 1000;
                }
            });
            total += 100;
        }
    });
})

app.get('/api/larsEmotes', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.setHeader('CDN-Cache-Control', 'public, s-max-age=3600');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600');

    const response = await fetch("https://7tv.io/v3/emote-sets/61df32674a3c173606dbf84e");
    const data = await response.json();
    const emotes = []
    data.emotes.forEach(emote => {if(emote.name.toLowerCase().includes('lars')){emotes.push(emote.name)}})

    res.send(emotes)
})

app.get('/api/kackyfins', async (req, res) => {
    const pets = await sql.sql(`SELECT * FROM kackyfins;`);
    res.send(pets)

})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})