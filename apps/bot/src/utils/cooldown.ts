import { redis } from '../lib/redis';

export class CooldownManager {
  /**
   * Atômico check-and-set para cooldown.
   * @param userId ID do usuário
   * @param guildId ID do servidor
   * @param action Nome da ação (ex: 'msg_xp', 'react_xp')
   * @param cooldownSec Segundos de cooldown
   * @returns true se PODE agir (não estava em cooldown), false se estava em cooldown
   */
  static async checkAndSet(userId: string, guildId: string, action: string, cooldownSec: number): Promise<boolean> {
    const key = `cooldown:${action}:${guildId}:${userId}`;
    // SET key value EX seconds NX (só seta se não existir)
    const result = await redis.set(key, '1', 'EX', cooldownSec, 'NX');
    return result === 'OK';
  }
}
