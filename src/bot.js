require('dotenv').config();
const Discord = require('discord.js');
const {Manager} = require("erela.js"); 
const MUSIC = require("./music"); 
const updatedMusic = require("./play")

const nodes = [{
    host: process.env.HOST,
    port: parseInt(process.env.PORT),
    password: process.env.PASSWORD,
}];

const PREFIX = process.env.PREFIX; 
let counter = 0; 
let done = false; 
const client = new Discord.Client({
    partials: ['MESSAGE', 'REACTION']
});
client.manager = new Manager({
    nodes,
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
})
.on("nodeConnect", node => console.log(`Node ${node.options.identifier} connected`))
.on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
.on("trackStart", (player, track) => {
  client.channels.cache
    .get(player.textChannel)
    .send(`Now playing: ${track.title}`);
})
.on("queueEnd", (player) => {
  client.channels.cache
    .get(player.textChannel)
    .send("Queue has ended.");
    player.destroy();
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on('message', async (message) => {
    if(message.author.bot || !message.content.startsWith(PREFIX)) return; 
    if(message.content.startsWith(PREFIX)){
        const [CMD_NAME, ...args] = message.content
            .toLowerCase()
            .trim()
            .substring(PREFIX.length,)
            .split(/\s+/);
        switch(CMD_NAME){
            case "play":
                if(!isNaN(args[0])) return; 
                updatedMusic.play(message, args, client.manager); 
                break; 
            case "skip":
                MUSIC.skip(message, client.manager);
                break; 
            case "seek":
                updatedMusic.seek(message, args, client.manager); 
                break;
            case "pause":
                updatedMusic.pause(message, client.manager);
                break; 
            case "ping":
                if(done) return; 
                if(counter > 6){
                    done = true; 
                    return message.reply("please do not spam, this command is now disabled."); 
                }
                message.channel.send('Pong.');
                counter++; 
                break; 
        }      
    }
});

client.once("ready", () => {
    console.log("Ready!");
    console.log(`${client.user.tag} has logged in`);
    client.manager.init(client.user.id); //have to initalize the player 
});
client.login(process.env.DISCORDJS_BOT_TOKEN); //log into Discord with app token which takes in the parameter bot token
