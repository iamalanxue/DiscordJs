const Skip = (message, manager) =>{
    const {id} = message.guild; 
    const player = manager.get(id); 
    const {channel} = message.member.voice;
    console.log(player.voiceChannel);
    if(player && channel){
        console.log("there is a channel and player")
        // console.log(channel.id)
        if(player.voiceChannel === channel.id){
            const members = channel.members.filter(m => !m.user.bot);
            //console.log(members.size); 
            if(members.size >= 1){
                player.stop();
                message.channel.send(`Skipping... ${player.queue.current.title}`); //${player.queue[0].title}
            }
        }
    }
    else{
        message.channel.send("Error: Either there is no player or you are not in a channel")
    }
}

module.exports = {
    skip: Skip
}