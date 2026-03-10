const { Client, GatewayIntentBits } = require('discord.js');
const { LavalinkManager } = require('lavalink-client');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize Lavalink Manager
client.lavalink = new LavalinkManager({
    nodes: [{
        authorization: process.env.LAVALINK_PASSWORD,
        host: process.env.LAVALINK_HOST,
        port: parseInt(process.env.LAVALINK_PORT),
        secure: false
    }],
    sendToShard: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    }
});

client.on('ready', () => {
    console.log(`${client.user.tag} is online!`);
    client.lavalink.init(client.user.id);
});

// Basic Play Command Example
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!play')) {
        const query = message.content.split(' ').slice(1).join(' ');
        const player = client.lavalink.createPlayer({
            guildId: message.guild.id,
            voiceChannelId: message.member.voice.channel.id,
            textChannelId: message.channel.id,
            selfDeaf: true
        });

        await player.connect();
        const res = await client.lavalink.search(query, message.author);
        player.queue.add(res.tracks[0]);
        if (!player.playing) await player.play();
        
        message.reply(`Queued: ${res.tracks[0].info.title}`);
    }
});

client.login(process.env.TOKEN);
