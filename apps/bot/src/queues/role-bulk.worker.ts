import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { prisma } from '../lib/database';
import { Client } from 'discord.js';
import { logger } from '../lib/logger';

// Esta fila processa adição e remoção de cargos em massa, respeitando os limites da API
export function startRoleBulkWorker(discordClient: Client) {
  const worker = new Worker('RoleBulkQueue', async (job: Job) => {
    const { guildId, roleId, action } = job.data;
    
    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) throw new Error('Guild not found');

    const role = guild.roles.cache.get(roleId);
    if (!role) throw new Error('Role not found');

    const members = await guild.members.fetch();
    const membersArray = Array.from(members.values());

    const batchSize = 5;
    const delayMs = 1500;

    for (let i = 0; i < membersArray.length; i += batchSize) {
      const batch = membersArray.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (m) => {
          if (action === 'add' && !m.roles.cache.has(role.id)) {
            await m.roles.add(role);
          } else if (action === 'remove' && m.roles.cache.has(role.id)) {
            await m.roles.remove(role);
          }
        })
      );

      // Report progress
      if (i % 50 === 0) {
        job.updateProgress(Math.floor((i / membersArray.length) * 100));
      }

      await new Promise(res => setTimeout(res, delayMs)); // Rate limit pause
    }
  }, {
    connection: { url: config.REDIS_URL }
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
