import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';
import { CurrencyManager } from '../../modules/economy/currency-manager';
import { XpCalculator } from '../../modules/rpg/xp-calculator';
import { LevelManager } from '../../modules/rpg/level-manager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Resgate seu bônus diário de XP e moedas.'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    await interaction.deferReply();

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } }
    });

    if (user && user.lastDaily) {
      const nextDaily = new Date(user.lastDaily.getTime() + 24 * 60 * 60 * 1000);
      if (now < nextDaily) {
        const timeDiff = nextDaily.getTime() - now.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return interaction.editReply(`Você já resgatou seu bônus diário! Tente novamente em **${hours}h ${minutes}m**.`);
      }
    }

    // Calcula bônus (aumenta com o streak)
    const streak = user ? user.dailyStreak : 0;
    // Se passou mais de 48h desde o último resgate, reseta o streak
    let newStreak = streak;
    if (user && user.lastDaily && (now.getTime() - user.lastDaily.getTime() > 48 * 60 * 60 * 1000)) {
      newStreak = 0;
    }
    newStreak += 1;

    const xpBonus = 100 + (newStreak * 10);
    const coinsBonus = Math.floor(xpBonus * 0.5);

    // Processar ganho (atomic update via LevelManager e Prisma)
    await prisma.user.upsert({
      where: { id_guildId: { guildId: BigInt(guildId), id: BigInt(userId) } },
      update: { lastDaily: now, dailyStreak: newStreak },
      create: { guildId: BigInt(guildId), id: BigInt(userId), lastDaily: now, dailyStreak: newStreak, level: 0, totalXp: 0, seasonXp: 0, coins: 0 },
    });

    const result = await LevelManager.processXpGain(guildId, userId, xpBonus, coinsBonus);
    
    // Registrar em daily_claims
    await prisma.dailyClaim.create({
      data: {
        guildId: BigInt(guildId),
        userId: BigInt(userId),
        claimedAt: now,
        xpReward: xpBonus,
        coinsReward: coinsBonus,
      }
    });

    // Registrar transação
    await prisma.transaction.create({
      data: {
        guildId: BigInt(guildId),
        userId: BigInt(userId),
        amount: coinsBonus,
        type: 'daily',
        description: `Bônus diário (Streak: ${newStreak})`,
      }
    });

    const currencyName = await CurrencyManager.getCurrencyName(guildId);

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('📅 Bônus Diário Resgatado!')
      .setDescription(`Você recebeu **${xpBonus} XP** e **${coinsBonus} ${currencyName}**!`)
      .setFooter({ text: `Sequência atual: ${newStreak} dias 🔥` });

    await interaction.editReply({ embeds: [embed] });

    if (result && result.leveled) {
      await interaction.followUp(`🎉 <@${userId}> subiu para o **Nível ${result.newLevel}** com o bônus diário!`);
      // Não recriar a imagem aqui para evitar spam, apenas texto, ou opcional
    }
  },
};

export default command;
