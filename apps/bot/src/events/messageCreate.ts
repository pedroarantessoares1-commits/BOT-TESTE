import { Events, Message, TextChannel } from 'discord.js';
import { BotEvent } from '../types';
import { prisma } from '../lib/database';
import { CooldownManager } from '../utils/cooldown';
import { XpCalculator } from '../modules/rpg/xp-calculator';
import { LevelManager } from '../modules/rpg/level-manager';
import { generateLevelUpCard } from '../canvas/level-up-card';
import { logger } from '../lib/logger';

const event: BotEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    try {
      const guildId = message.guild.id;
      const userId = message.author.id;

      // Pegar configuração do servidor cacheada idealmente, aqui faremos direto do banco pra simplificar
      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(guildId) },
      });

      if (!config) return;

      // Verificar cooldown (padrão 60s)
      const canAct = await CooldownManager.checkAndSet(userId, guildId, 'msg_xp', config.messageCooldownSec);
      if (!canAct) return;

      // Calcular XP e Coins
      let xpAmount = XpCalculator.randomXp(config.xpMessageMin, config.xpMessageMax);
      
      // Aplicar multiplicador de canal se existir
      const multiplierRecord = await prisma.channelXpMultiplier.findUnique({
        where: { guildId_channelId: { guildId: BigInt(guildId), channelId: BigInt(message.channel.id) } },
      });
      if (multiplierRecord) {
        xpAmount = Math.floor(xpAmount * Number(multiplierRecord.multiplier));
      }

      const coinsAmount = XpCalculator.coinsFromXp(xpAmount);

      const result = await LevelManager.processXpGain(guildId, userId, xpAmount, coinsAmount);

      if (result && result.leveled) {
        let notifChannel: TextChannel | null = null;
        if (config.levelupChannelId) {
          notifChannel = message.guild.channels.cache.get(config.levelupChannelId.toString()) as TextChannel;
        }
        if (!notifChannel) {
          notifChannel = message.channel as TextChannel;
        }

        if (notifChannel && notifChannel.isTextBased()) {
          const cardBuffer = await generateLevelUpCard(
            message.author.displayAvatarURL({ extension: 'png', size: 256 }),
            message.author.username,
            result.oldLevel,
            result.newLevel
          );
          
          await notifChannel.send({
            content: `<@${userId}> subiu de nível!`,
            files: [{ attachment: cardBuffer, name: 'levelup.png' }],
          });
        }

        await LevelManager.assignLevelRole(message.guild, message.member!, result.newLevel);
      }
    } catch (err) {
      logger.error('Error in messageCreate event:', err);
    }
  },
};

export default event;
