import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';
import { generateProfileCard } from '../../canvas/profile-card';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Exibe o seu perfil ou o de outro usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('usuario') || interaction.user;
    const guildId = interaction.guild!.id;

    const dbUser = await prisma.user.findUnique({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(user.id) } },
      include: { _count: { select: { userAchievements: true } } }
    });

    if (!dbUser) {
      return interaction.editReply('Usuário não encontrado no banco de dados.');
    }

    // Calcular rank simple
    const higherUsers = await prisma.user.count({
      where: { guildId: BigInt(guildId), seasonXp: { gt: dbUser.seasonXp } }
    });
    const rank = higherUsers + 1;

    const buffer = await generateProfileCard({
      avatarUrl: user.displayAvatarURL({ extension: 'png', size: 256 }),
      username: user.username,
      level: dbUser.level,
      totalXp: Number(dbUser.totalXp),
      seasonXp: Number(dbUser.seasonXp),
      coins: Number(dbUser.coins),
      rank,
      achievements: dbUser._count.userAchievements,
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: 'profile.png' }] });
  },
};

export default command;
