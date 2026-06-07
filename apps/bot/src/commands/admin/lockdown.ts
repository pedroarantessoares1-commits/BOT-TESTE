import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Ativa ou desativa o lockdown manual.')
    .addBooleanOption(opt => opt.setName('ativar').setDescription('True para ativar, False para desativar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const ativar = interaction.options.getBoolean('ativar', true);
    const guildId = interaction.guild!.id;

    await prisma.serverConfig.update({
      where: { guildId: BigInt(guildId) },
      data: { lockdownActive: ativar },
    });

    try {
      if (ativar) {
        await interaction.guild!.setVerificationLevel(4);
      } else {
        await interaction.guild!.setVerificationLevel(2); // Retorna para LOW/MEDIUM
      }
    } catch (e) {}

    await interaction.reply(ativar ? '🚨 Lockdown manual ATIVADO.' : '✅ Lockdown manual DESATIVADO.');
  },
};

export default command;
