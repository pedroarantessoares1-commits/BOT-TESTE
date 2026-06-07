import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('missoes')
    .setDescription('Lista suas missões ativas.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guild!.id;
    const userId = interaction.user.id;

    const userMissions = await prisma.userMission.findMany({
      where: { guildId: BigInt(guildId), userId: BigInt(userId), completed: false },
      include: { mission: true }
    });

    const embed = new EmbedBuilder()
      .setTitle(`📜 Missões de ${interaction.user.username}`)
      .setColor('#5865F2');

    if (userMissions.length === 0) {
      embed.setDescription('Você não possui missões ativas no momento.');
    } else {
      userMissions.forEach(um => {
        embed.addFields({
          name: `${um.mission.type === 'daily' ? '📅 Diária' : '🗓️ Semanal'} - ${um.mission.description}`,
          value: `Progresso: ${um.progress} / ${um.mission.objectiveValue}\nRecompensas: ${um.mission.rewardXp} XP | ${um.mission.rewardCoins} Coins`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
