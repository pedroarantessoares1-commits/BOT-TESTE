import { Client, VoiceChannel, TextChannel } from 'discord.js';
import { generateLevelUpCard } from '../../utils/levelCard';
import { LevelManager } from './level-manager';
import { XpCalculator } from './xp-calculator';
import { prisma } from '../../lib/database';
import { logger } from '../../lib/logger';

export class VoiceTracker {
    private static interval: NodeJS.Timeout;

    static startTracking(client: Client) {
        this.interval = setInterval(() => this.processVoiceXp(client), 60000);
        logger.info('VoiceTracker started.');
    }

    static async processVoiceXp(client: Client) {
        try {
            const configs = await prisma.serverConfig.findMany();
            const configMap = new Map(configs.map(c => [c.guildId.toString(), c]));

            for (const guild of client.guilds.cache.values()) {
                const config = configMap.get(guild.id);
                if (!config) continue;

                for (const channel of guild.channels.cache.values()) {
                    if (channel.isVoiceBased() && channel instanceof VoiceChannel) {
                        const eligibleUsers = await this.getEligibleUsers(channel);

                        for (const member of eligibleUsers) {
                            const xpAmount = XpCalculator.randomXp(config.xpVoiceMin, config.xpVoiceMax);
                            const coinsAmount = XpCalculator.coinsFromXp(xpAmount);

                            const result = await LevelManager.processXpGain(guild.id, member.id, xpAmount, coinsAmount);

                            if (result && result.leveled) {
                                try {
                                    let notifChannel: TextChannel | null = null;
                                    if (config.levelupChannelId) {
                                        notifChannel = guild.channels.cache.get(config.levelupChannelId.toString()) as TextChannel;
                                    }
                                    if (!notifChannel) {
                                        notifChannel = guild.systemChannel as TextChannel;
                                    }

                                    if (notifChannel) {
                                        const cardBuffer = await generateLevelUpCard(
                                            member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                                            member.displayName, // Nickname do servidor ativado
                                            result.oldLevel,
                                            result.newLevel
                                        );

                                        await notifChannel.send({
                                            content: `✨ <@${member.id}> subiu de nível!`,
                                            files: [{ attachment: cardBuffer, name: 'levelup.png' }]
                                        });
                                    }

                                    await LevelManager.assignLevelRole(guild, member, result.newLevel);
                                } catch (e: any) {
                                    logger.error(`Error sending voice level up notification: ${e?.message || e}`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            logger.error(`Error in VoiceTracker interval: ${err?.message || err}`);
        }
    }

    private static async getEligibleUsers(channel: VoiceChannel): Promise<any[]> {
        const members = [];
        for (const member of channel.members.values()) {
            if (member.user.bot) continue;
            if (member.voice.deaf || member.voice.selfDeaf) continue;

            members.push(member);
        }
        return members;
    }
}