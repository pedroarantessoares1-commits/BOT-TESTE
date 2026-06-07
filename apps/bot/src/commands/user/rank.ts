import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Exibe o top 10 do servidor.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guild!.id;

    const topUsers = await prisma.user.findMany({
      where: { guildId: BigInt(guildId) },
      orderBy: { seasonXp: 'desc' },
      take: 10
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 - Temporada Atual')
      .setColor('#FFD700');

    if (topUsers.length === 0) {
      embed.setDescription('Nenhum usuário encontrado.');
    } else {
      topUsers.forEach((u, i) => {
        let medal = '🏅';
        if (i === 0) medal = '🥇';
        if (i === 1) medal = '🥈';
        if (i === 2) medal = '🥉';
        
        embed.addFields({
          name: `${medal} #${i+1} | Nível ${u.level}`,
          value: `<@${u.id}> - ${u.seasonXp} XP`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
