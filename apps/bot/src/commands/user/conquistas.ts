import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('conquistas')
    .setDescription('Lista suas conquistas.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guild!.id;
    const userId = interaction.user.id;

    const userAchvs = await prisma.userAchievement.findMany({
      where: { guildId: BigInt(guildId), userId: BigInt(userId) },
      include: { achievement: true }
    });

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Conquistas de ${interaction.user.username}`)
      .setColor('#5865F2');

    if (userAchvs.length === 0) {
      embed.setDescription('Você ainda não possui conquistas.');
    } else {
      userAchvs.forEach(ua => {
        embed.addFields({
          name: `${ua.achievement.icon || '🏅'} ${ua.achievement.name}`,
          value: `Desbloqueada em <t:${Math.floor(ua.unlockedAt.getTime() / 1000)}:d>`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
