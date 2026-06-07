import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { prisma } from '../lib/database';
import { Client, TextChannel } from 'discord.js';
import { logger } from '../lib/logger';

// Processo assíncrono para o Reset de Temporada
export function startSeasonResetWorker(discordClient: Client) {
  const worker = new Worker('SeasonResetQueue', async (job: Job) => {
    const { guildId, keepHistory } = job.data;
    
    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) throw new Error('Guild not found');

    // 1. Marcar a temporada antiga como inativa e pegar stats
    const currentSeason = await prisma.season.findFirst({
      where: { guildId: BigInt(guildId), isActive: true },
      orderBy: { seasonNum: 'desc' }
    });

    const nextSeasonNum = currentSeason ? currentSeason.seasonNum + 1 : 1;

    // TODO: Criar os snapshots (já feito no command season-manager ou fazer aqui)
    
    // 2. Fetch members and roles
    const members = await guild.members.fetch();
    const membersArray = Array.from(members.values());

    const configRow = await prisma.serverConfig.findUnique({ where: { guildId: BigInt(guildId) } });
    const defaultRoleId = configRow?.defaultRoleId;

    const batchSize = 5;
    const delayMs = 1500;

    for (let i = 0; i < membersArray.length; i += batchSize) {
      const batch = membersArray.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (m) => {
          // Remover roles de nivel (nome que começa com 'Nível ')
          const levelRoles = m.roles.cache.filter(r => r.name.startsWith('Nível '));
          if (levelRoles.size > 0) {
            await m.roles.remove(levelRoles);
          }

          // Atribuir defaultRole
          if (defaultRoleId && !m.roles.cache.has(defaultRoleId.toString())) {
            await m.roles.add(defaultRoleId.toString()).catch(()=>null);
          }
        })
      );

      job.updateProgress(Math.floor((i / membersArray.length) * 100));
      await new Promise(res => setTimeout(res, delayMs)); // Rate limit pause
    }

    // 3. Atualizar DB
    await prisma.$transaction(async (tx) => {
      // Zerar seasonXp e/ou totalXp e level
      const updateData: any = { seasonXp: 0, level: 0 };
      if (!keepHistory) {
        updateData.totalXp = 0;
        // não zeramos coins na temporada, a não ser que o requisito mude
      }

      await tx.user.updateMany({
        where: { guildId: BigInt(guildId) },
        data: updateData,
      });

      if (currentSeason) {
        await tx.season.update({
          where: { id: currentSeason.id },
          data: { isActive: false, endedAt: new Date() }
        });
      }

      await tx.season.create({
        data: {
          guildId: BigInt(guildId),
          seasonNum: nextSeasonNum,
          startedAt: new Date(),
          isActive: true
        }
      });
    });

    logger.info(`Season reset complete for guild ${guildId}`);
  }, {
    connection: { url: config.REDIS_URL }
  });

  worker.on('failed', (job, err) => {
    logger.error(`Season reset Job ${job?.id} failed:`, err);
  });

  return worker;
}
