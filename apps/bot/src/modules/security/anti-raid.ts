import { GuildMember } from 'discord.js';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/database';
import { ModLog } from '../logging/mod-log';
import { logger } from '../../lib/logger';

export class AntiRaid {
  /**
   * Monitora entradas. Retorna true se um raid foi detectado neste evento.
   */
  static async recordJoin(member: GuildMember): Promise<boolean> {
    const guildId = member.guild.id;
    const userId = member.user.id;
    const now = Date.now();
    const key = `antiraid:${guildId}:joins`;

    try {
      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(guildId) },
        select: { antiraidJoins: true, antiraidSeconds: true, lockdownActive: true },
      });

      if (!config || config.antiraidJoins <= 0) return false;
      if (config.lockdownActive) return false; // Já em lockdown

      const pipeline = redis.pipeline();
      
      // Adicionar join ao sorted set (score = timestamp)
      pipeline.zadd(key, now, `${userId}:${now}`);
      
      // Remover entradas mais antigas que a janela configurada
      const windowStart = now - (config.antiraidSeconds * 1000);
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Contar na janela
      pipeline.zcard(key);
      
      // TTL para não acumular lixo
      pipeline.expire(key, config.antiraidSeconds * 2);

      const results = await pipeline.exec();
      if (!results) return false;

      const joinCount = results[2][1] as number;

      if (joinCount >= config.antiraidJoins) {
        await this.activateLockdown(member.guild, joinCount, config.antiraidSeconds);
        return true;
      }

      return false;
    } catch (err) {
      logger.error('Error in AntiRaid.recordJoin:', err);
      return false;
    }
  }

  static async activateLockdown(guild: any, joinCount: number, windowSec: number) {
    logger.warn(`🚨 Anti-Raid ativado no servidor ${guild.id}`);
    
    // Atualizar no banco
    await prisma.serverConfig.update({
      where: { guildId: BigInt(guild.id) },
      data: { lockdownActive: true },
    });

    // Pausar convites, elevar nível de verificação (se bot tiver permissão)
    try {
      await guild.setVerificationLevel(4); // VERY_HIGH
      // Opcional: pausar invites do guild
    } catch (e) {
      logger.warn(`Não foi possível alterar verification level no guild ${guild.id}`);
    }

    // Logar embed roxo
    await ModLog.logEvent(guild.id, 'antiraid', {
      reason: `Lockdown ativado! ${joinCount} membros entraram em ${windowSec} segundos.`,
      details: { joinCount, windowSec }
    });

    // TODO: agendar disable do lockdown via BullMQ worker
  }
}
