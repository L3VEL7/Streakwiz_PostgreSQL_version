const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Refresh the bot\'s command cache (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Check if the user has administrator permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.editReply({
                    content: '❌ You do not have permission to use this command.',
                    ephemeral: true
                });
                return;
            }

            // Clear the command cache
            interaction.client.commands.clear();

            // Reload all commands
            const fs = require('fs');
            const path = require('path');
            const commandsPath = path.join(__dirname);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    const command = require(filePath);

                    if (!command.data || !command.data.name || !command.execute) {
                        console.warn(`[WARNING] The command at ${file} is missing required properties. Skipping.`);
                        continue;
                    }

                    interaction.client.commands.set(command.data.name, command);
                    console.log(`Reloaded command: ${command.data.name}`);
                } catch (error) {
                    console.error(`[ERROR] Failed to reload command ${file}:`, error);
                }
            }

            // Register the refreshed commands
            const commands = [];
            for (const command of interaction.client.commands.values()) {
                commands.push(command.data.toJSON());
            }

            try {
                await interaction.client.application.commands.set(commands);
                await interaction.editReply({
                    content: '✅ Command cache refreshed successfully!',
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error registering refreshed commands:', error);
                await interaction.editReply({
                    content: '❌ Failed to register refreshed commands. Please try using `/restart` instead.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in refresh command:', error);
            try {
                await interaction.editReply({
                    content: '❌ An error occurred while trying to refresh the commands.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }
}; 