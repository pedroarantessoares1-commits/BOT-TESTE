import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o slow mode de um canal.')
    .addChannelOption(opt => opt.setName('canal').setDescription('O canal').setRequired(true))
    .addIntegerOption(opt => opt.setName('segundos').setDescription('Duração em segundos (0 para desativar)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('canal', true) as TextChannel;
    const seconds = interaction.options.getInteger('segundos', true);

    if (!channel.isTextBased() || !('setRateLimitPerUser' in channel)) {
      return interaction.reply({ content: 'Este canal não suporta slow mode.', ephemeral: true });
    }

    try {
      await channel.setRateLimitPerUser(seconds, `Slowmode ativado por ${interaction.user.tag}`);
      await interaction.reply(`Slow mode no canal <#${channel.id}> definido para ${seconds} segundos.`);
    } catch (err) {
      await interaction.reply({ content: 'Falha ao alterar o slow mode.', ephemeral: true });
    }
  },
};

export default command;
