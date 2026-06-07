import { Events, GuildMember } from 'discord.js';
import { BotEvent } from '../types';
import { AccountAgeGate } from '../modules/security/account-age-gate';
import { AntiRaid } from '../modules/security/anti-raid';
import { generateVerificationToken } from '../utils/crypto';
import { prisma } from '../lib/database';
import { config } from '../config';
import { logger } from '../lib/logger';

const event: BotEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    if (member.user.bot) return;

    try {
      // 1. Account Age Gate
      const passedAgeGate = await AccountAgeGate.checkMember(member);
      if (!passedAgeGate) return; // Já foi kickado

      // 2. Anti-Raid
      const isRaid = await AntiRaid.recordJoin(member);
      if (isRaid) {
        // Se ativou lockdown, os membros seguintes devem ser kickados ou ignorados.
        // Aqui apenas registramos e deixamos o módulo lidar.
      }

      // 3. Sistema de Verificação Web
      const serverConfig = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(member.guild.id) },
        select: { unverifiedRoleId: true }
      });

      if (serverConfig && serverConfig.unverifiedRoleId) {
        // Atribuir cargo não verificado
        await member.roles.add(serverConfig.unverifiedRoleId.toString()).catch(() => {});

        // Gerar token e enviar link por DM
        const token = generateVerificationToken(member.guild.id, member.user.id);
        const verifyUrl = `http://localhost:${config.PORT}/verify?token=${token}`; // Substituir localhost pelo domínio em prod

        try {
          await member.send(`Bem-vindo ao **${member.guild.name}**! Para acessar o servidor, por favor, clique no link abaixo para se verificar:\n${verifyUrl}\n\n*O link expira em 24h.*`);
        } catch (e) {
          logger.warn(`Não foi possível enviar DM de verificação para ${member.user.tag}`);
        }
      }
    } catch (err) {
      logger.error('Error in guildMemberAdd event:', err);
    }
  },
};

export default event;
