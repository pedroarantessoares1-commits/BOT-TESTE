import { Events, Client } from 'discord.js';
import { BotEvent } from '../types';
import { logger } from '../lib/logger';
import { VoiceTracker } from '../modules/rpg/voice-tracker';
import { VerificationGate } from '../modules/security/verification-gate';
import { startRoleBulkWorker } from '../queues/role-bulk.worker';
import { startSeasonResetWorker } from '../queues/season-reset.worker';

const event: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    logger.info(`✅ Bot logado como ${client.user?.tag}! Servidores: ${client.guilds.cache.size}`);
    
    // Iniciar Voice Tracker (ganho de XP periódico)
    VoiceTracker.startTracking(client);

    // Iniciar Express Server para Verificação Web (IP Ban & hCaptcha)
    // O client customizado é necessário para dar cargos
    VerificationGate.startServer(client as any);

    // Iniciar BullMQ Workers
    startRoleBulkWorker(client);
    startSeasonResetWorker(client);
    
    logger.info('🚀 Todos os módulos iniciados com sucesso.');
  },
};

export default event;
