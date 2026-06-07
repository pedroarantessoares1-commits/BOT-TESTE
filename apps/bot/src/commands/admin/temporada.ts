import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';
import { Queue } from 'bullmq';
import { config } from '../../config';

const seasonQueue = new Queue('SeasonResetQueue', { connection: { url: config.REDIS_URL } });

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('temporada')
    .setDescription('Gerencia as temporadas do servidor.')
    .addSubcommand(sub => 
      sub.setName('reset')
        .setDescription('Inicia o processo de reset de temporada')
        .addStringOption(opt => opt.setName('confirmacao').setDescription('Digite CONFIRMAR RESET TEMPORADA para prosseguir').setRequired(true))
        .addBooleanOption(opt => opt.setName('manter_historico').setDescription('Manter histórico de XP total?'))
    )
    .addSubcommand(sub => 
      sub.setName('historico')
        .setDescription('Exibe o histórico de temporadas anteriores')
    )
    .addSubcommand(sub => 
      sub.setName('info')
        .setDescription('Informações da temporada atual')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (subCmd === 'info') {
      const season = await prisma.season.findFirst({
        where: { guildId: BigInt(guildId), isActive: true },
        orderBy: { seasonNum: 'desc' }
      });

      if (!season) return interaction.reply('Não há uma temporada ativa.');

      const embed = new EmbedBuilder()
        .setTitle(`🌟 Temporada ${season.seasonNum} (Atual)`)
        .setColor('#FFD700')
        .addFields({ name: 'Início', value: `<t:${Math.floor(season.startedAt.getTime() / 1000)}:f>` });

      await interaction.reply({ embeds: [embed] });

    } else if (subCmd === 'reset') {
      const confirmacao = interaction.options.getString('confirmacao', true);
      if (confirmacao !== 'CONFIRMAR RESET TEMPORADA') {
        return interaction.reply({ content: 'Confirmação incorreta. Ação cancelada.', ephemeral: true });
      }

      const keepHistory = interaction.options.getBoolean('manter_historico') || false;

      // 1. Salvar snapshot do top 50 e xp
      const topUsers = await prisma.user.findMany({
        where: { guildId: BigInt(guildId), seasonXp: { gt: 0 } },
        orderBy: { seasonXp: 'desc' },
        take: 50
      });

      const currentSeason = await prisma.season.findFirst({
        where: { guildId: BigInt(guildId), isActive: true },
        orderBy: { seasonNum: 'desc' }
      });

      if (currentSeason) {
        // Preparar dados do snapshot
        const snapshotData = topUsers.map((u, i) => ({
          seasonId: currentSeason.id,
          userId: u.id,
          finalLevel: u.level,
          finalXp: u.seasonXp,
          finalCoins: u.coins,
          rankPos: i + 1,
        }));

        if (snapshotData.length > 0) {
          await prisma.seasonSnapshot.createMany({ data: snapshotData });
        }

        // Anunciar no chat
        const channel = interaction.channel as TextChannel;
        const embed = new EmbedBuilder()
          .setTitle(`🏆 Fim da Temporada ${currentSeason.seasonNum}!`)
          .setColor('#FFD700')
          .setDescription('A temporada foi encerrada! Parabéns aos top 10:');
        
        const top10 = topUsers.slice(0, 10);
        top10.forEach((u, i) => {
          embed.addFields({ name: `#${i+1} Nível ${u.level}`, value: `<@${u.id}> - ${u.seasonXp} XP` });
        });

        await channel.send({ embeds: [embed] }).catch(()=>null);
      }

      // Adicionar job na fila
      await seasonQueue.add('reset', { guildId, keepHistory });

      await interaction.reply('Reset de temporada iniciado em background! Você será notificado (via console/logs) quando terminar.');
    } else if (subCmd === 'historico') {
      const seasons = await prisma.season.findMany({
        where: { guildId: BigInt(guildId) },
        orderBy: { seasonNum: 'desc' }
      });

      const embed = new EmbedBuilder()
        .setTitle('📜 Histórico de Temporadas')
        .setColor('#2F3136');

      seasons.forEach(s => {
        const start = `<t:${Math.floor(s.startedAt.getTime() / 1000)}:d>`;
        const end = s.endedAt ? `<t:${Math.floor(s.endedAt.getTime() / 1000)}:d>` : 'Atual';
        embed.addFields({ name: `Temporada ${s.seasonNum}`, value: `Período: ${start} até ${end}` });
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
