import sharp from 'sharp';
import { Message } from 'discord.js';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/database';
import { ModLog } from '../logging/mod-log';
import { logger } from '../../lib/logger';

export class AntiSpamImage {
  static async computeImageHash(imageBuffer: Buffer, size = 8): Promise<string> {
    const pixels = await sharp(imageBuffer)
      .grayscale()
      .resize(size + 1, size, { fit: 'fill' })
      .raw()
      .toBuffer();

    let hash = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = pixels[y * (size + 1) + x];
        const right = pixels[y * (size + 1) + x + 1];
        hash += left > right ? '1' : '0';
      }
    }
    return hash;
  }

  static hammingDistance(hash1: string, hash2: string): number {
    let dist = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) dist++;
    }
    return dist;
  }

  static async checkMessage(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild || message.attachments.size === 0) return false;

    try {
      // Verificar whitelist
      const isWhitelisted = await prisma.spamWhitelist.findUnique({
        where: { guildId_entityType_entityId: { guildId: BigInt(message.guild.id), entityType: 'user', entityId: BigInt(message.author.id) } },
      });
      if (isWhitelisted) return false;

      const config = await prisma.serverConfig.findUnique({
        where: { guildId: BigInt(message.guild.id) },
        select: { antispamImgCount: true, antispamImgSeconds: true },
      });

      if (!config || config.antispamImgCount <= 0) return false;

      const attachment = message.attachments.first();
      if (!attachment || !attachment.contentType?.startsWith('image/')) return false;

      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const hash = await this.computeImageHash(buffer);

      const userId = message.author.id;
      const guildId = message.guild.id;
      const key = `antispam_img:${guildId}:${userId}`;
      const now = Date.now();

      const pipeline = redis.pipeline();
      pipeline.zadd(key, now, `${hash}:${now}`);
      const windowStart = now - (config.antispamImgSeconds * 1000);
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zrange(key, 0, -1);
      pipeline.expire(key, config.antispamImgSeconds * 2);

      const results = await pipeline.exec();
      if (!results) return false;

      const items = results[2][1] as string[]; // Array de "hash:timestamp"

      if (items.length >= config.antispamImgCount) {
        // Encontrou flood, deletar e mutar
        await message.delete().catch(() => {});
        
        const member = message.member;
        if (member) {
          await member.timeout(10 * 60 * 1000, 'Anti-Spam Imagem: Flood detectado');
        }

        await ModLog.logEvent(guildId, 'antispam', {
          targetUserId: userId,
          reason: `Flood de imagens: ${items.length} imagens em ${config.antispamImgSeconds}s`,
          details: { hash }
        });
        return true;
      }

      // Checar também spam cross-channel (mesma imagem em vários canais)
      // Iterar sobre os itens salvos para ver se há hamming distance baixa (similaridade)
      let similarCount = 0;
      for (const item of items) {
        const itemHash = item.split(':')[0];
        if (this.hammingDistance(hash, itemHash) <= 10) {
          similarCount++;
        }
      }

      // Se houver 3 imagens similares, consideramos spam
      if (similarCount >= 3) {
        await message.delete().catch(() => {});
        const member = message.member;
        if (member) {
          await member.timeout(10 * 60 * 1000, 'Anti-Spam Imagem: Imagens duplicadas detectadas');
        }
        await ModLog.logEvent(guildId, 'antispam', {
          targetUserId: userId,
          reason: `Imagens duplicadas detectadas (Cross-channel)`,
        });
        return true;
      }

      return false;
    } catch (err) {
      logger.error('Error in AntiSpamImage:', err);
      return false;
    }
  }
}
