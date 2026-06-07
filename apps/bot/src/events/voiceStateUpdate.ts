import { Events, VoiceState } from 'discord.js';
import { BotEvent } from '../types';
import { VoiceTracker } from '../modules/rpg/voice-tracker';
import { logger } from '../lib/logger';

const event: BotEvent<Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    try {
      await VoiceTracker.handleVoiceStateUpdate(oldState, newState);
    } catch (err) {
      logger.error('Error in voiceStateUpdate event:', err);
    }
  },
};

export default event;
