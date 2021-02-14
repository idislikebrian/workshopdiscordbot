const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports={
    name: 'musicPlayer',
    description: "Helps you play music together",
    async execute (message, args){
        console.log(args)
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel) {
            const connection = await voiceChannel.join();
            if (connection) {
                // searching for music via ytdl
                if (ytdl.validateURL(message.content)) {
                    const songInfo = await ytdl.getBasicInfo(message.content);
                    song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url }
                } else {
                    // if the video is not a URL then use keywords to find a video
                    const videoFinder = async (query) =>{
                        const videoResult = await ytSearch(query);
                        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
                    }
                    const video = await videoFinder(args.join(' '));
                    if(video){
                        song = { title: video.title, url: video.url }
                    } else {
                    message.channel.send('Error finding that song.');
                    }
                } 
                const dispatcher = connection.play(ytdl(song.url, { format: 'audioonly' }));
                const musicEmbed = new MessageEmbed()
                    .setTitle('Music Player')
                    .setImage(`${songInfo.videoDetails.thumbnail.thumbnails[0].url}`)
                    .setFooter(`${songInfo.videoDetails.title}`)
                    .setColor('BLUE');

                const sentMusicEmbed = await message.channel.send(musicEmbed);
                sentMusicEmbed.react('⏹️');
                sentMusicEmbed.react('⏸️');

                let filter = (reaction, user) => !user.bot && user.id === message.author.id;
                const reactionCollector = sentMusicEmbed.createReactionCollector(filter);

                reactionCollector.on('collect', (reaction) => {
                    if (reaction.emoji.name === '⏸️') {
                        dispatcher.pause();
                        reaction.remove();
                        sentMusicEmbed.react('▶️');
                    } else if (reaction.emoji.name === '▶️') {
                        dispatcher.resume();
                        reaction.remove();
                        sentMusicEmbed.react('⏸️');
                    } else if (reaction.emoji.name === '⏹️') {
                        connection.disconnect();
                        sentMusicEmbed.delete();
                    } else {
                        reaction.remove();
                    }

                });

                dispatcher.on('finish', () => {
                    connection.disconnect();
                    sentMusicEmbed.delete();
                });
            }
        } else {
            message.channel.send('Please join a voice channel first');
        }
    }
};