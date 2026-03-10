const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const PlayerManager = require('./PlayerManager');
const buttonHandler = require('./buttonHandler');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const Nodes = [{
    name: 'Abrox-Node',
    url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
    auth: process.env.LAVALINK_PASSWORD,
    secure: false
}];

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
const manager = new PlayerManager(client);

// Slash Command Definitions
const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube/Spotify')
        .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true))
].map(command => command.toJSON());

client.on('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ Abrox Music Online | Commands Synced`);
});

// Main Music Logic
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) return buttonHandler(interaction, shoukaku, manager);
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'play') {
        await interaction.deferReply();
        const query = interaction.options.getString('query');
        const state = manager.getOrCreateState(interaction.guild.id);
        
        let player = shoukaku.players.get(interaction.guild.id);
        if (!player) {
            player = await shoukaku.joinVoiceChannel({
                guildId: interaction.guild.id,
                channelId: interaction.member.voice.channel.id,
                shardId: 0
            });

            // Lavalink Event: Track Ends -> Play Next
            player.on('end', async () => {
                if (state.queue.length > 0) {
                    const nextTrack = state.queue.shift();
                    await player.playTrack({ track: nextTrack.encoded });
                    await manager.updateNowPlaying(interaction, player, nextTrack);
                }
            });
        }

        const node = shoukaku.getNode();
        const result = await node.rest.resolve(`ytsearch:${query}`);
        const track = result.data[0];

        if (player.track) {
            state.queue.push(track);
            return interaction.followup.send(`Queued: **${track.info.title}**`);
        }

        await player.playTrack({ track: track.encoded });
        await manager.updateNowPlaying(interaction, player, track);
        await interaction.deleteReply();
    }
});

client.login(process.env.DISCORD_TOKEN);
