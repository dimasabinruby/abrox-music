module.exports = async (interaction, shoukaku, manager) => {
    if (!interaction.isButton()) return;

    const player = shoukaku.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: '❌ No active player found.', ephemeral: true });

    const state = manager.getOrCreateState(interaction.guild.id);

    switch (interaction.customId) {
        case 'pause':
            state.paused = !state.paused;
            await player.setPaused(state.paused);
            interaction.reply({ content: state.paused ? '⏸️ Paused' : '▶️ Resumed', ephemeral: true });
            break;

        case 'skip':
            await player.stopTrack(); // Lavalink automatically moves to next on stop
            interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
            break;

        case 'stop':
            state.queue = [];
            await shoukaku.leaveVoiceChannel(interaction.guild.id);
            interaction.reply({ content: '⏹️ Stopped and disconnected.', ephemeral: true });
            break;

        case 'loop':
            const modes = ['none', 'track', 'queue'];
            const currentIdx = modes.indexOf(state.loop);
            state.loop = modes[(currentIdx + 1) % 3];
            interaction.reply({ content: `🔄 Loop mode set to: **${state.loop}**`, ephemeral: true });
            break;
    }
};
