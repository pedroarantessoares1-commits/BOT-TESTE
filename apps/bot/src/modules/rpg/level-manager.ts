import { Guild, GuildMember } from 'discord.js';
import { prisma } from '../../lib/database';
import { logger } from '../../lib/logger';
import { XpCalculator } from './xp-calculator';
import { generateLevelUpCard } from '../../canvas/level-up-card';
import { sendLevelUpMessage } from '../../events/messageCreate'; // Helper para enviar, ou usar client
import { CustomClient } from '../../client';

export class LevelManager {
  /**
   * Processa o ganho de XP de um usuário, atualizando banco de dados.
   */
  static async processXpGain(guildId: string, userId: string, xpAmount: number, coinsAmount: number) {
    try {
      const gId = BigInt(guildId);
      const uId = BigInt(userId);

      // Usar transaction ou atomic increment
      // Como o prisma não suporta atomic update retornado o valor modificado tão facilmente com cálculo de nível,
      // faremos um read, modify, write. Cuidado com concorrência aqui. Ideal seria upsert e depois verificar.
      
      const user = await prisma.user.upsert({
        where: { id_guildId: { id: uId, guildId: gId } },
        update: {
          totalXp: { increment: xpAmount },
          seasonXp: { increment: xpAmount },
          coins: { increment: coinsAmount },
        },
        create: {
          id: uId,
          guildId: gId,
          totalXp: xpAmount,
          seasonXp: xpAmount,
          coins: coinsAmount,
          level: 0,
        },
      });

      // Calcular nível atual a partir do totalXp atualizado
      const currentLevel = user.level;
      const newLevel = XpCalculator.levelFromXp(Number(user.seasonXp));

      let leveled = false;
      if (newLevel > currentLevel) {
        leveled = true;
        await prisma.user.update({
          where: { id_guildId: { id: uId, guildId: gId } },
          data: { level: newLevel },
        });
      }

      return { leveled, oldLevel: currentLevel, newLevel, user };
    } catch (err) {
      logger.error('Error processing XP gain:', err);
      return null;
    }
  }

  static getLevelRoleName(level: number): string {
    return `Nível ${level}`;
  }

  static shouldGetRole(level: number): boolean {
    return level > 0 && level % 10 === 0;
  }

  /**
   * Atribui cargo de nível e remove o anterior (substituído, conforme default).
   */
  static async assignLevelRole(guild: Guild, member: GuildMember, newLevel: number) {
    if (!this.shouldGetRole(newLevel)) return;

    try {
      const roleName = this.getLevelRoleName(newLevel);
      let role = guild.roles.cache.find(r => r.name === roleName);
      
      if (!role) {
        role = await guild.roles.create({
          name: roleName,
          reason: 'Cargo automático de nível',
        });
      }

      await member.roles.add(role);

      // Remover cargo do nível anterior se for cumulativo vs substituído (default: substituído)
      const previousLevel = newLevel - 10;
      if (previousLevel > 0) {
        const prevRoleName = this.getLevelRoleName(previousLevel);
        const prevRole = guild.roles.cache.find(r => r.name === prevRoleName);
        if (prevRole && member.roles.cache.has(prevRole.id)) {
          await member.roles.remove(prevRole);
        }
      }
    } catch (err) {
      logger.error(`Failed to assign level role to ${member.user.tag}:`, err);
    }
  }
}
