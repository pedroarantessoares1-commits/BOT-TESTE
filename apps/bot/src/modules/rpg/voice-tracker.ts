import { Client, VoiceState, VoiceChannel, TextChannel } from 'discord.js';
import { redis } from '../../lib/redis';
import { LevelManager } from './level-manager';
import { XpCalculator } from './xp-calculator';
import { prisma } from '../../lib/database';
import { logger } from '../../lib/logger';
import { generateLevelUpCard } from '../../canvas/level-up-card';

export class VoiceTracker {
  private static interval: NodeJS.Timeout;

  static startTracking(client: Client) {
    // Roda a cada 60 segundos
    this.interval = setInterval(() => this.processVoiceXp(client), 60000);
    logger.info('VoiceTracker started.');
  }

  static async processVoiceXp(client: Client) {
    try {
      // Buscar configs dos servidores cacheadas ou no banco para pegar xp_voice_min/max
      // Para otimizar, buscaremos todas as configs
      const configs = await prisma.serverConfig.findMany();
      const configMap = new Map(configs.map(c => [c.guildId.toString(), c]));

      for (const guild of client.guilds.cache.values()) {
        const config = configMap.get(guild.id);
        if (!config) continue;

        for (const channel of guild.channels.cache.values()) {
          if (channel.isVoiceBased() && channel instanceof VoiceChannel) {
            const eligibleUsers = await this.getEligibleUsers(channel);
            
            for (const member of eligibleUsers) {
              const xpAmount = XpCalculator.randomXp(config.xpVoiceMin, config.xpVoiceMax);
              const coinsAmount = XpCalculator.coinsFromXp(xpAmount);

              const result = await LevelManager.processXpGain(guild.id, member.id, xpAmount, coinsAmount);
              
              if (result && result.leveled) {
                // Notificar level up (tentar mandar no canal padrão de levelup ou no chat geral/system)
                try {
                  let notifChannel: TextChannel | null = null;
                  if (config.levelupChannelId) {
                    notifChannel = guild.channels.cache.get(config.levelupChannelId.toString()) as TextChannel;
                  }
                  if (!notifChannel) {
                    notifChannel = guild.systemChannel as TextChannel;
                  }

                  if (notifChannel) {
                    const cardBuffer = await generateLevelUpCard(
                      member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                      member.user.username,
                      result.oldLevel,
                      result.newLevel
                    );
                    await notifChannel.send({
                      content: `<@${member.id}> subiu de nível!`,
                      files: [{ attachment: cardBuffer, name: 'levelup.png' }]
                    });
                  }

                  await LevelManager.assignLevelRole(guild, member, result.newLevel);
                } catch (e) {
                  logger.error('Error sending voice level up notification', e);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.error('Error in VoiceTracker interval', err);
    }
  }

  static async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const member = newState.member;
    if (!member || member.user.bot) return;

    // Se mutado + ensurdecido, registrar timestamp
    const isMutedDeaf = newState.selfDeaf && newState.selfMute;
    const redisKey = `voice_mute_deaf:${member.guild.id}:${member.id}`;

    if (isMutedDeaf) {
      await redis.set(redisKey, Date.now().toString());
    } else {
      await redis.del(redisKey);
    }
  }

  private static async getEligibleUsers(channel: VoiceChannel) {
    const members = channel.members.filter(m => !m.user.bot);
    if (members.size < 2) return []; // Precisa de pelo menos 2 humanos

    const eligible = [];
    for (const member of members.values()) {
      const redisKey = `voice_mute_deaf:${member.guild.id}:${member.id}`;
      const muteTimestamp = await redis.get(redisKey);

      if (muteTimestamp) {
        const timeMuted = Date.now() - parseInt(muteTimestamp);
        // > 10 min (600000ms) ignorar
        if (timeMuted > 600000) continue;
      }

      eligible.push(member);
    }

    return eligible;
  }
}
