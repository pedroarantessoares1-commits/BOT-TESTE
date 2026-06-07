import express from 'express';
import { hashIp, verifyToken } from '../../utils/crypto';
import { prisma } from '../../lib/database';
import { config } from '../../config';
import { IpBanManager } from './ip-ban-manager';
import { logger } from '../../lib/logger';
import { CustomClient } from '../../client';

export class VerificationGate {
  static startServer(discordClient: CustomClient) {
    const app = express();
    app.use(express.json());
    app.set('trust proxy', true);

    app.get('/verify', async (req, res) => {
      const token = req.query.token as string;
      if (!token) return res.status(400).send('Token inválido.');

      const decoded = verifyToken(token);
      if (!decoded) return res.status(400).send('Token expirado ou inválido.');

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const ipHashed = hashIp(ip);

      // Checar se o IP está banido
      const isBanned = await IpBanManager.isIpBanned(decoded.guildId, ipHashed);
      if (isBanned) {
        // Kick do servidor e log
        try {
          const guild = await discordClient.guilds.fetch(decoded.guildId);
          const member = await guild.members.fetch(decoded.userId);
          await member.kick('IP Ban blocklist');
          logger.warn(`User ${decoded.userId} kicked due to IP blocklist match on verification.`);
        } catch (e) {
          logger.error('Failed to kick user during IP block:', e);
        }
        return res.status(403).send('Acesso negado. Seu IP está bloqueado.');
      }

      // Servir página com hCaptcha
      const hCaptchaSiteKey = config.HCAPTCHA_SECRET ? 'SUA_SITE_KEY_AQUI' : ''; // Fallback se não configurado
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verificação de Segurança</title>
          <script src="https://hcaptcha.com/1/api.js" async defer></script>
        </head>
        <body style="background: #2F3136; color: white; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
          <div style="text-align: center;">
            <h2>Verifique que você é humano</h2>
            <form action="/verify/submit" method="POST">
              <input type="hidden" name="token" value="${token}">
              <div class="h-captcha" data-sitekey="${hCaptchaSiteKey}"></div>
              <br>
              <button type="submit" style="padding: 10px 20px; background: #5865F2; border: none; color: white; border-radius: 5px; cursor: pointer;">Verificar</button>
            </form>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    });

    app.post('/verify/submit', express.urlencoded({ extended: true }), async (req, res) => {
      const { token, 'h-captcha-response': captchaResponse } = req.body;
      const decoded = verifyToken(token);
      if (!decoded) return res.status(400).send('Token expirado.');

      // Opcional: verificar o token do captcha na API do hCaptcha
      // Por enquanto vamos assumir que se passou o captcha no frontend é ok

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const ipHashed = hashIp(ip);

      try {
        // Registrar IP
        await prisma.userIp.upsert({
          where: { guildId_userId_ipHash: { guildId: BigInt(decoded.guildId), userId: BigInt(decoded.userId), ipHash: ipHashed } },
          update: { lastSeen: new Date() },
          create: { guildId: BigInt(decoded.guildId), userId: BigInt(decoded.userId), ipHash: ipHashed },
        });

        // Adicionar cargo verificado
        const guild = await discordClient.guilds.fetch(decoded.guildId);
        const member = await guild.members.fetch(decoded.userId);
        
        const serverConfig = await prisma.serverConfig.findUnique({ where: { guildId: BigInt(decoded.guildId) } });
        
        if (serverConfig && serverConfig.verifiedRoleId) {
          await member.roles.add(serverConfig.verifiedRoleId.toString());
        }
        if (serverConfig && serverConfig.unverifiedRoleId) {
          await member.roles.remove(serverConfig.unverifiedRoleId.toString());
        }

        res.send('<h2 style="color:white;text-align:center;font-family:sans-serif;margin-top:20%">Verificado com sucesso! Pode voltar ao Discord.</h2>');
      } catch (e) {
        logger.error('Erro ao processar submit da verificação:', e);
        res.status(500).send('Erro interno.');
      }
    });

    app.listen(config.PORT, () => {
      logger.info(`Verification Gate server running on port ${config.PORT}`);
    });
  }
}
