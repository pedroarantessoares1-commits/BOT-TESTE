import { prisma } from '../../lib/database';
import { ShopItem } from '@prisma/client';

export class ShopManager {
  static async getItems(guildId: string): Promise<ShopItem[]> {
    return prisma.shopItem.findMany({
      where: { guildId: BigInt(guildId), isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  static async getItem(id: number): Promise<ShopItem | null> {
    return prisma.shopItem.findUnique({
      where: { id },
    });
  }
}
