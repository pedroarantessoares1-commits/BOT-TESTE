import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Consulta os logs de moderação (últimos 10).')
    .addStringOption(opt => 
      opt.setName('tipo')
        .setDescription('Filtrar por tipo de evento')
        .addChoices(
          { name: 'Ban', value: 'ban' },
          { name: 'Kick', value: 'kick' },
          { name: 'Mute', value: 'mute' },
          { name: 'Anti-Raid', value: 'antiraid' },
          { name: 'Anti-Spam', value: 'antispam' }
        )
    )
    .addUserOption(opt => opt.setName('usuario').setDescription('Filtrar por usuário'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('tipo');
    const user = interaction.options.getUser('usuario');

    const whereClause: any = { guildId: BigInt(interaction.guild!.id) };
    if (type) whereClause.eventType = type;
    if (user) whereClause.targetUserId = BigInt(user.id);

    const logs = await prisma.moderationLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const embed = new EmbedBuilder()
      .setTitle('Logs de Moderação (Últimos 10)')
      .setColor('#2F3136');

    if (logs.length === 0) {
      embed.setDescription('Nenhum log encontrado para os filtros selecionados.');
    } else {
      logs.forEach(log => {
        let content = `**Data:** <t:${Math.floor(log.createdAt.getTime() / 1000)}:f>\n`;
        if (log.targetUserId) content += `**Alvo:** <@${log.targetUserId}>\n`;
        if (log.moderatorId) content += `**Mod:** <@${log.moderatorId}>\n`;
        if (log.reason) content += `**Motivo:** ${log.reason}\n`;
        
        embed.addFields({
          name: `Log #${log.id} - ${log.eventType.toUpperCase()}`,
          value: content || 'Sem detalhes',
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
