import { Events, Message, PartialMessage } from 'discord.js';
import { BotEvent } from '../types';
import { ModLog } from '../modules/logging/mod-log';
import { logger } from '../lib/logger';

const event: BotEvent<Events.MessageDelete> = {
  name: Events.MessageDelete,
  async execute(message: Message | PartialMessage) {
    if (message.author?.bot || !message.guild) return;

    try {
      await ModLog.logEvent(message.guild.id, 'msg_delete', {
        targetUserId: message.author?.id,
        details: {
          channelId: message.channel.id,
          content: message.content || '[Sem conteúdo / Apenas Anexos]',
        }
      });
    } catch (err) {
      logger.error('Error in messageDelete event:', err);
    }
  },
};

export default event;
