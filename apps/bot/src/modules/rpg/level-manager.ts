import { Guild, GuildMember } from 'discord.js';
import { prisma } from '../../lib/database';
import { logger } from '../../lib/logger';
import { XpCalculator } from './xp-calculator';

export class LevelManager {
  /**
   * Processa o ganho de XP de um usuário, atualizando banco de dados.
   */
  static async processXpGain(guildId: string, userId: string, xpAmount: number, coinsAmount: number) {
    try {
      const gId = BigInt(guildId);
      const uId = BigInt(userId);
      
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

      // Calcular nível atual a partir do seasonXp atualizado usando a nova curva
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
    } catch (err: any) {
      logger.error(`Error processing XP gain: ${err?.message || err}`);
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
   * Atribui cargo de nível e remove o anterior.
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

      const previousLevel = newLevel - 10;
      if (previousLevel > 0) {
        const prevRoleName = this.getLevelRoleName(previousLevel);
        const prevRole = guild.roles.cache.find(r => r.name === prevRoleName);
        if (prevRole && member.roles.cache.has(prevRole.id)) {
          await member.roles.remove(prevRole);
        }
      }
    } catch (err: any) {
      logger.error(`Failed to assign level role to ${member.user.tag}: ${err?.message || err}`);
    }
  }
}