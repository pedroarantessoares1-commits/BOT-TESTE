import { prisma } from '../../lib/database';
import { GuildMember } from 'discord.js';
import { logger } from '../../lib/logger';
import { ShopItem } from '@prisma/client';

export class TransactionHandler {
  /**
   * Compra atômica para evitar race conditions
   */
  static async purchaseItem(member: GuildMember, item: ShopItem): Promise<{ success: boolean; message: string }> {
    const guildId = member.guild.id;
    const userId = member.user.id;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verificar saldo (com lock)
        const user = await tx.user.findUnique({
          where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
        });

        if (!user || user.coins < BigInt(item.price)) {
          throw new Error('Saldo insuficiente.');
        }

        // Verificar estoque se existir
        if (item.stock !== null) {
          const currentItem = await tx.shopItem.findUnique({ where: { id: item.id } });
          if (!currentItem || currentItem.stock! <= 0) {
            throw new Error('Item fora de estoque.');
          }
          await tx.shopItem.update({
            where: { id: item.id },
            data: { stock: { decrement: 1 } },
          });
        }

        // Debitar saldo
        await tx.user.update({
          where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
          data: { coins: { decrement: item.price } },
        });

        // Registrar transação
        await tx.transaction.create({
          data: {
            guildId: BigInt(guildId),
            userId: BigInt(userId),
            itemId: item.id,
            amount: item.price,
            type: 'purchase',
            description: `Comprou: ${item.name}`,
          },
        });

        return true;
      });

      if (result) {
        // Entregar o item
        await this.deliverItem(member, item);
        return { success: true, message: `Você comprou **${item.name}** com sucesso!` };
      }
      return { success: false, message: 'Falha desconhecida.' };
    } catch (error: any) {
      if (error.message === 'Saldo insuficiente.' || error.message === 'Item fora de estoque.') {
        return { success: false, message: error.message };
      }
      logger.error('Transaction error:', error);
      return { success: false, message: 'Ocorreu um erro interno durante a compra.' };
    }
  }

  private static async deliverItem(member: GuildMember, item: ShopItem) {
    if (item.itemType === 'role_permanent' || item.itemType === 'role_temporary' || item.itemType === 'role_seasonal') {
      if (item.itemValue) {
        const role = member.guild.roles.cache.get(item.itemValue);
        if (role) {
          await member.roles.add(role);
          // Para temporários, agenda remoção (pode ser via fila BullMQ para não perder caso o bot reinicie, ou apenas DB)
          // Implementação via BullMQ (a ser adicionado)
        }
      }
    }
    // Outros tipos: badge, xp_booster
  }
}
