import { Events, Message, PartialMessage } from 'discord.js';
import { BotEvent } from '../types';
import { ModLog } from '../modules/logging/mod-log';
import { logger } from '../lib/logger';
import { AntiSpamText } from '../modules/security/anti-spam-text';

const event: BotEvent<Events.MessageUpdate> = {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (newMessage.author?.bot || !newMessage.guild) return;
    if (oldMessage.content === newMessage.content) return;

    try {
      // Checar anti-spam no novo conteúdo
      if (newMessage instanceof Message) {
        await AntiSpamText.checkMessage(newMessage);
      }

      await ModLog.logEvent(newMessage.guild.id, 'msg_edit', {
        targetUserId: newMessage.author?.id,
        details: {
          channelId: newMessage.channel.id,
          before: oldMessage.content || '[Sem conteúdo]',
          after: newMessage.content || '[Sem conteúdo]',
        }
      });
    } catch (err) {
      logger.error('Error in messageUpdate event:', err);
    }
  },
};

export default event;
