const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateMusicCard } = require('./generateCard');

class PlayerManager {
    constructor(client) {
        this.client = client;
        this.states = new Map();
    }

    getOrCreateState(guildId) {
        if (!this.states.has(guildId)) {
            this.states.set(guildId, {
                queue: [],
                history: [],
                loop: 'none', // none, track, queue
                autoplay: false,
                lastMessage: null,
                paused: false
            });
        }
        return this.states.get(guildId);
    }

    async updateNowPlaying(interaction, player, track) {
        const state = this.getOrCreateState(interaction.guild.id);
        
        // Generate the Frosted Glass Card
        const buffer = await generateMusicCard(track.info, interaction.user.displayName);
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(buffer, { name: 'card.png' });

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`🎶 Now Playing: ${track.info.title}`)
            .setURL(track.info.uri)
            .setImage('attachment://card.png')
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('loop').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary)
        );

        // Delete old message if exists (like your Python logic)
        if (state.lastMessage) {
            try { await state.lastMessage.delete(); } catch (e) {}
        }

        state.lastMessage = await interaction.channel.send({ 
            embeds: [embed], 
            components: [row], 
            files: [attachment] 
        });
    }
}

module.exports = PlayerManager;
