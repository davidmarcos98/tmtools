const TMIO = require('trackmania.io');
client = new TMIO.Client();

client.players.get("f37147a8-36f3-4c58-9577-bf0faff3aafa").then(async player=>{
    const cotd = await player.matchmaking();

    console.log(cotd);
});

