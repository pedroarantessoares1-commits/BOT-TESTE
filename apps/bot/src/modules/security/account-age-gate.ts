import { GuildMember, EmbedBuilder } from 'discord.js';
import { prisma } from '../../lib/database';
import { ModLog } from '../logging/mod-log';
import { logger } from '../../lib/logger';

export class AccountAgeGate {
  /**
   * Verifica idade da conta. Retorna true se passou (ou foi ignorado), false se foi bloqueado.
   */
  static async checkMember(member: GuildMember): Promise<boolean> {
    try {
      const guildId = member.guild.id;
      const userId = member.user.id;

      // Verifica whitelist
      const isWhitelisted = await prisma.accountWhitelist.findUnique({
        where: { guildId_userId: { guildId: BigInt(guildId), userId: BigInt(userId) } },
      });
      if (isWhitelisted) return true;

      // Pega config do servidor
      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(guildId) },
        select: { minAccountAgeDays: true },
      });
      
      const minDays = config?.minAccountAgeDays || 30;
      if (minDays <= 0) return true;

      const accountAgeMs = Date.now() - member.user.createdTimestamp;
      const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

      if (accountAgeDays < minDays) {
        const returnDate = new Date(member.user.createdTimestamp + minDays * 24 * 60 * 60 * 1000);
        
        // Tenta enviar DM
        try {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Entrada Bloqueada')
            .setDescription(`Você foi removido automaticamente do servidor **${member.guild.name}**.\nO servidor exige que contas tenham pelo menos **${minDays} dias** de criação.`)
            .addFields({ name: 'Quando poderei retornar?', value: returnDate.toLocaleDateString('pt-BR') });
          await member.send({ embeds: [embed] });
        } catch (e) {
          logger.warn(`Could not send DM to ${member.user.tag} before Age Gate kick.`);
        }

        // Kicka
        await member.kick('Conta muito nova (Account Age Gate)');

        // Registra log
        await ModLog.logEvent(guildId, 'age_block', {
          targetUserId: userId,
          reason: `Conta criada há ${Math.floor(accountAgeDays)} dias (Mínimo: ${minDays})`,
        });

        return false;
      }

      return true;
    } catch (err) {
      logger.error('Error in AccountAgeGate:', err);
      return true; // Falha aberta em caso de erro interno
    }
  }
}
