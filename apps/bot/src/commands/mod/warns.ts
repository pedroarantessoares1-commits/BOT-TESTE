import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Lista as advertências de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a consultar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);

    const warnings = await prisma.warning.findMany({
      where: { guildId: BigInt(interaction.guild!.id), userId: BigInt(user.id) },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const embed = new EmbedBuilder()
      .setTitle(`Advertências de ${user.username}`)
      .setColor('#FF8C00');

    if (warnings.length === 0) {
      embed.setDescription('Este usuário não possui advertências.');
    } else {
      warnings.forEach((warn, index) => {
        embed.addFields({
          name: `⚠️ Advertência ${index + 1} (${warn.createdAt.toLocaleDateString()})`,
          value: `**Motivo:** ${warn.reason}\n**Moderador:** <@${warn.moderatorId}>`,
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
