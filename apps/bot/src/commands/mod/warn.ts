import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica uma advertência a um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a advertir').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da advertência').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo', true);

    await prisma.warning.create({
      data: {
        guildId: BigInt(interaction.guild!.id),
        userId: BigInt(user.id),
        moderatorId: BigInt(interaction.user.id),
        reason,
      }
    });

    try {
      await user.send(`Você recebeu uma advertência no servidor **${interaction.guild!.name}**.\nMotivo: ${reason}`);
    } catch(e) {} // Ignorar erro de DM fechada

    await interaction.reply(`Advertência aplicada ao usuário <@${user.id}>.`);
  },
};

export default command;
