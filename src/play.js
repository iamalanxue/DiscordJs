const VOLUME = 30;
async function PLAY(message,args,manager){
    if(!message.member.hasPermission('CONNECT')){
        return message.channel.send("I don\'t have the **CONNECT** permission");
    }
    if(!message.member.hasPermission('SPEAK')){
        return message.channel.send("I don\'t have the **SPEAK** permission");
    }
    if(args.length === 0) return message.channel.send('You did not provide a Youtube link');
    let voiceChannel = message.member.voice.channel;
    if(voiceChannel){
        console.log(`${voiceChannel.name} was found and is a ${voiceChannel.type} channel`);
        const {id} = message.guild; 
        let player = manager.get(id); 
        if(!player){
            player = manager.create({
                guild: message.guild.id,
                voiceChannel: message.member.voice.channel.id,
                textChannel: message.channel.id,
              });
        }
    player.setVolume(VOLUME);
    player.connect();  
    let query = args.join(" ")
    try{
        let res = await player.search(query, message.author);
        //console.log(res);
        switch(res.loadType){
            case "TRACK_LOADED":
                console.log(res.tracks[0]);
                player.queue.add(res.tracks[0]);
                if (!player.playing && !player.paused && !player.queue.size) player.play();
                return message.channel.send(`Enqueuing track: **${res.tracks[0].title}**`);
            case "SEARCH_RESULT":
                let searchResults = res;
                let i = 1; 
                const tracks = searchResults.tracks.slice(0,5); 
                const intro = "**Use commands `1-5` or `?play 1-5` to select a track** \n"; 
                const tracksInfo = intro + tracks.map(track => `**${i++}:**   ${track.title}`).join("\n");
                message.channel.send(tracksInfo);
                try{
                    const filter = m => (message.author.id === m.author.id) && ((m.content >= 1 && m.content <= tracks.length) || m.content.toLowerCase().startsWith("?play"));
                    const response = await message.channel
                    .awaitMessages(filter, {max: 1, time: 30000, errors: ['time']});
                    if(response){
                        let entry = response.first().content; 
                        if(entry.length > 1){ //this is for the ?play case 
                            entry = entry.toLowerCase().trim().substring(6,);
                        }
                        const number = parseInt(entry); 
                        const track = tracks[number-1];
                        //console.log(track); 
                        player.queue.add(track);
                        message.channel.send(`Enqueuing track: **${track.title}**`);
                    }
                    if (!player.playing && !player.paused && !player.queue.size)
                        player.play();
                }
                catch(err){
                    console.log(err); 
                }
        }
    }
    catch(err){
        return message.reply(`there was an error while searching: ${err.message}`);
    }
    }
    else{
        message.channel.send("Please join a voice channel")
    }
}


const Seek = (message, args, manager) =>{
    const {id} = message.guild; 
    const player = manager.get(id); 
    const {channel} = message.member.voice;
    // console.log(player.voiceChannel);
    if(player && channel){
        // console.log("there is a channel and player")
        // console.log(channel.id)
        if(player.voiceChannel === channel.id){
            const members = channel.members.filter(m => !m.user.bot);
            //console.log(members.size); 
            if(members.size >= 1){
                const query = args.join(" "); 
                console.log(query); 
                if(!query){
                    console.log("empty string");
                    let yourMessage = "#Set the position of the track to the given time. Example: ?seek 32:23";
                    return message.reply(yourMessage, {
                        code: "md",
                      });
                    
                }
                // there are errors like what if the user doesnt enter seconds and not minutes 
                let time = query.split(/\W+/); 
                let minutes = parseInt(time[0]);
                let seconds = parseInt(time[1]);
                let milliseconds = (minutes*60 + seconds)*1000; 
                if(player.queue.current.duration > milliseconds){
                    player.seek(milliseconds);
                    message.channel.send(`Forwarding to ${minutes} minutes and ${seconds} seconds`);
                }
                else{
                    message.reply(`that number is out of the video duration!`);
                }
            }
        }
    }
    else{
        message.channel.send("Error: Either there is no player or you are not in a channel")
    }
}

async function Pause(message, manager){
    const {id} = message.guild;
    const player = manager.get(id); 
    const {channel} = message.member.voice;
    if(player && channel){
        if(player.playing){
            player.pause(true);
        }
        else{
            message.channel.send("I'm already paused. Do you want to resume yes/no?");
            try{
                const filter = m => (message.author.id === m.author.id) && (m.content === "yes" || m.content === 'y' || m.content === 'no' || m.content === 'n');
                const response = await message.channel
                .awaitMessages(filter, {max: 1, time: 30000, errors: ['time']});
                if(response){
                    const entry = response.first().content.toLowerCase();
                    if(entry === 'yes' || entry === 'y'){
                        player.pause(false);
                    }
                }
            }
            catch (err){
                console.log(err);
            }
        }
    }
    else{
        message.channel.send("Error: Either there is no player or you are not in a channel")
    }
}


module.exports = {
    pause: Pause,
    seek: Seek, 
    play: PLAY
}