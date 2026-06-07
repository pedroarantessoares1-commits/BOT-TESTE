import { EmbedBuilder, TextChannel } from 'discord.js';
import { prisma } from '../../lib/database';
import { logger } from '../../lib/logger';
import { CustomClient } from '../../client';

const COLORS: Record<string, string> = {
  ban: '#FF0000',
  kick: '#FF8C00',
  mute: '#FFD700',
  antiraid: '#800080',
  antispam: '#0080FF',
  msg_edit: '#808080',
  msg_delete: '#2F3136',
  age_block: '#8B4513',
  ipban: '#000000',
};

const TITLES: Record<string, string> = {
  ban: '🔨 Banimento',
  kick: '👢 Expulsão',
  mute: '🔇 Mute',
  antiraid: '🚨 Anti-Raid Ativado',
  antispam: '🛡️ Anti-Spam Acionado',
  msg_edit: '✏️ Mensagem Editada',
  msg_delete: '🗑️ Mensagem Deletada',
  age_block: '👶 Bloqueio por Idade',
  ipban: '☠️ IP Ban',
};

export class ModLog {
  private static client: CustomClient;

  static init(client: CustomClient) {
    this.client = client;
  }

  static async logEvent(
    guildId: string,
    eventType: string,
    data: {
      targetUserId?: string;
      moderatorId?: string;
      reason?: string;
      details?: any;
    }
  ) {
    try {
      // 1. Salvar no banco de dados
      await prisma.moderationLog.create({
        data: {
          guildId: BigInt(guildId),
          eventType,
          targetUserId: data.targetUserId ? BigInt(data.targetUserId) : null,
          moderatorId: data.moderatorId ? BigInt(data.moderatorId) : null,
          reason: data.reason,
          details: data.details,
        },
      });

      // 2. Enviar para o canal de logs, se configurado
      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(guildId) },
        select: { logChannelId: true },
      });

      if (!config || !config.logChannelId) return;

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(config.logChannelId.toString()) as TextChannel;
      if (!channel || !channel.isTextBased()) return;

      const color = COLORS[eventType] || '#FFFFFF';
      const title = TITLES[eventType] || 'Evento de Moderação';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color as any)
        .setTimestamp();

      if (data.targetUserId) embed.addFields({ name: 'Alvo', value: `<@${data.targetUserId}>`, inline: true });
      if (data.moderatorId) embed.addFields({ name: 'Moderador', value: `<@${data.moderatorId}>`, inline: true });
      if (!data.moderatorId && eventType !== 'msg_edit' && eventType !== 'msg_delete') embed.addFields({ name: 'Moderador', value: `🤖 Bot (Automático)`, inline: true });
      if (data.reason) embed.addFields({ name: 'Motivo', value: data.reason });

      if (data.details) {
        if (data.details.before && data.details.after) {
          embed.addFields({ name: 'Antes', value: String(data.details.before).substring(0, 1024) });
          embed.addFields({ name: 'Depois', value: String(data.details.after).substring(0, 1024) });
        } else if (data.details.content) {
          embed.addFields({ name: 'Conteúdo', value: String(data.details.content).substring(0, 1024) });
        } else {
          embed.addFields({ name: 'Detalhes', value: JSON.stringify(data.details).substring(0, 1024) });
        }
      }

      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      logger.error('Error logging mod event:', err);
    }
  }
}
