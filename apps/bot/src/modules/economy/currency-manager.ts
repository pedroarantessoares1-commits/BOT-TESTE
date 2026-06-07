import { prisma } from '../../lib/database';

export class CurrencyManager {
  static async getBalance(guildId: string, userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
      select: { coins: true },
    });
    return user ? Number(user.coins) : 0;
  }

  static async addCoins(guildId: string, userId: string, amount: number): Promise<number> {
    const user = await prisma.user.upsert({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
      update: { coins: { increment: amount } },
      create: { guildId: BigInt(guildId), id: BigInt(userId), coins: amount, level: 0, totalXp: 0, seasonXp: 0 },
      select: { coins: true },
    });
    return Number(user.coins);
  }

  static async removeCoins(guildId: string, userId: string, amount: number): Promise<boolean> {
    const current = await this.getBalance(guildId, userId);
    if (current < amount) return false;

    await prisma.user.update({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
      data: { coins: { decrement: amount } },
    });
    return true;
  }

  static async getCurrencyName(guildId: string): Promise<string> {
    const config = await prisma.serverConfig.findUnique({
      where: { guildId: BigInt(guildId) },
      select: { currencyName: true },
    });
    return config?.currencyName || 'Coins';
  }
}
