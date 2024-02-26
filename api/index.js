const express = require('express')
const app = express()
const port = 3000
const TMIO = require('trackmania.io');
const ordinal = require('ordinal-number-suffix')

client = new TMIO.Client();

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

app.get('/ranks', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

    let result = {}
    client.campaigns.currentSeason().then(async campaign=>{
        let total = 100;
        while (total < 1000){
            const leaderboard = await campaign.leaderboardLoadMore(100);
            leaderboard.slice(leaderboard.length - 100).forEach(top=>{
                if (top.playerName == req.query.player){
                    result = {
                        player: top.playerName,
                        rank: top.position,
                        points: top.points,
                        id: top._data.player.id
                    }
                    total = 1000;
                }
            });
            total += 100;
        }
        const player = await client.players.get(result.id);
        const mm = await player.matchmaking();
        console.log(mm)
        result.mm = {
            division: mm.division.name,
            rank: mm.rank,
            score: mm.score
        }
        result.text = getChatText(result);
        res.send(result)
    });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})