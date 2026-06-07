import { prisma } from '../../lib/database';

export class IpBanManager {
  static async banUserIps(guildId: string, userId: string, adminId: string, reason: string) {
    // Buscar todos os IPs associados a esse user
    const userIps = await prisma.userIp.findMany({
      where: { guildId: BigInt(guildId), userId: BigInt(userId) },
    });

    let count = 0;
    for (const ip of userIps) {
      try {
        await prisma.bannedIp.upsert({
          where: { guildId_ipHash: { guildId: BigInt(guildId), ipHash: ip.ipHash } },
          update: { reason, bannedBy: BigInt(adminId) },
          create: {
            guildId: BigInt(guildId),
            ipHash: ip.ipHash,
            originalUserId: BigInt(userId),
            reason,
            bannedBy: BigInt(adminId),
          },
        });
        count++;
      } catch (err) {
        // Ignorar duplicatas
      }
    }
    return count;
  }

  static async isIpBanned(guildId: string, ipHash: string): Promise<boolean> {
    const banned = await prisma.bannedIp.findUnique({
      where: { guildId_ipHash: { guildId: BigInt(guildId), ipHash } },
    });
    return banned !== null;
  }
}
