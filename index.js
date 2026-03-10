const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Lavalink Node Details
const Nodes = [{
    name: 'Main Node',
    url: process.env.LAVALINK_HOST + ':' + process.env.LAVALINK_PORT,
    auth: process.env.LAVALINK_PASSWORD,
    secure: false
}];

// Initialize Shoukaku (Lavalink Manager)
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

shoukaku.on('error', (_, error) => console.error('Lavalink Error:', error));
shoukaku.on('ready', (name) => console.log(`✅ Lavalink Node ${name} is connected!`));

// In-Memory Database (Replaces your server_states dictionary)
client.serverStates = new Map();

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`✅ Loaded Abrox Music UI Premium Edition (6.2)!`);
    client.user.setActivity('/help | Premium Bot | 50+ Commands');
});

// Basic Play Command Translation
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'play') {
        await interaction.deferReply();
        const search = interaction.options.getString('search');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) return interaction.followup.send('❌ You need to be in a voice channel first!');

        // Connect to Lavalink Player
        const player = await shoukaku.joinVoiceChannel({
            guildId: interaction.guild.id,
            channelId: voiceChannel.id,
            shardId: 0
        });

        // Search Lavalink instead of yt-dlp
        const node = shoukaku.getNode();
        const result = await node.rest.resolve(`ytsearch:${search}`);

        if (!result || result.data.length === 0) {
            return interaction.followup.send('❌ No results found!');
        }

        const track = result.data[0];
        await player.playTrack({ track: track.encoded });

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`🎵 **Now Playing:** ${track.info.title}`);

        await interaction.followup.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
