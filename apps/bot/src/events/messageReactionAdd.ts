import { Events, MessageReaction, User, TextChannel } from 'discord.js';
import { BotEvent } from '../types';
import { prisma } from '../lib/database';
import { CooldownManager } from '../utils/cooldown';
import { XpCalculator } from '../modules/rpg/xp-calculator';
import { LevelManager } from '../modules/rpg/level-manager';
import { generateLevelUpCard } from '../canvas/level-up-card';
import { logger } from '../lib/logger';

const event: BotEvent<Events.MessageReactionAdd> = {
  name: Events.MessageReactionAdd,
  async execute(reaction: MessageReaction, user: User) {
    if (user.bot || !reaction.message.guild) return;

    // Não dar XP por curtir própria mensagem
    if (reaction.message.author?.id === user.id) return;

    try {
      const guildId = reaction.message.guild.id;
      const userId = user.id;

      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(guildId) },
      });

      if (!config) return;

      const canAct = await CooldownManager.checkAndSet(userId, guildId, 'react_xp', config.reactionCooldownSec);
      if (!canAct) return;

      const xpAmount = XpCalculator.randomXp(config.xpReactionMin, config.xpReactionMax);
      const coinsAmount = XpCalculator.coinsFromXp(xpAmount);

      const result = await LevelManager.processXpGain(guildId, userId, xpAmount, coinsAmount);

      if (result && result.leveled) {
        let notifChannel: TextChannel | null = null;
        if (config.levelupChannelId) {
          notifChannel = reaction.message.guild.channels.cache.get(config.levelupChannelId.toString()) as TextChannel;
        }
        if (!notifChannel) {
          notifChannel = reaction.message.channel as TextChannel;
        }

        if (notifChannel && notifChannel.isTextBased()) {
          const cardBuffer = await generateLevelUpCard(
            user.displayAvatarURL({ extension: 'png', size: 256 }),
            user.username,
            result.oldLevel,
            result.newLevel
          );
          
          await notifChannel.send({
            content: `<@${userId}> subiu de nível!`,
            files: [{ attachment: cardBuffer, name: 'levelup.png' }],
          });
        }

        const member = await reaction.message.guild.members.fetch(userId);
        await LevelManager.assignLevelRole(reaction.message.guild, member, result.newLevel);
      }
    } catch (err) {
      logger.error('Error in messageReactionAdd event:', err);
    }
  },
};

export default event;
