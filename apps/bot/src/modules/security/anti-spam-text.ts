import { Message } from 'discord.js';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/database';
import { ModLog } from '../logging/mod-log';
import { logger } from '../../lib/logger';

export class AntiSpamText {
  static async checkMessage(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild) return false;

    try {
      // Verificar whitelist
      const isWhitelisted = await prisma.spamWhitelist.findUnique({
        where: { guildId_entityType_entityId: { guildId: BigInt(message.guild.id), entityType: 'user', entityId: BigInt(message.author.id) } },
      });
      if (isWhitelisted) return false;

      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(message.guild.id) },
      });

      if (!config || config.antispamTxtCount <= 0) return false;

      const userId = message.author.id;
      const guildId = message.guild.id;
      
      // Checar mensagens idênticas (baseado em hash MD5 do conteúdo)
      const contentHash = Buffer.from(message.content).toString('base64');
      const key = `antispam_txt_dup:${guildId}:${userId}:${contentHash}`;
      
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, config.antispamTxtSeconds);
      }

      if (count >= config.antispamTxtCount) {
        await message.delete().catch(() => {});
        if (message.member) {
          await message.member.timeout(10 * 60 * 1000, 'Anti-Spam Texto: Mensagens idênticas repetidas');
        }

        await ModLog.logEvent(guildId, 'antispam', {
          targetUserId: userId,
          reason: `Mensagens idênticas repetidas: ${count}x em ${config.antispamTxtSeconds}s`,
        });
        return true;
      }

      // Slow mode check
      const channelKey = `antispam_slow:${guildId}:${message.channel.id}`;
      const msgCount = await redis.incr(channelKey);
      if (msgCount === 1) {
        await redis.expire(channelKey, 10); // Janela fixa de 10s
      }

      if (msgCount > 15) {
        if (message.channel.isTextBased() && 'setRateLimitPerUser' in message.channel) {
          await message.channel.setRateLimitPerUser(5, 'Auto Slowmode: Alto tráfego detectado');
          await ModLog.logEvent(guildId, 'antispam', {
            reason: `Auto Slowmode ativado no canal <#${message.channel.id}> (>15msgs/10s)`,
          });
        }
      }

      return false;
    } catch (err) {
      logger.error('Error in AntiSpamText:', err);
      return false;
    }
  }
}
