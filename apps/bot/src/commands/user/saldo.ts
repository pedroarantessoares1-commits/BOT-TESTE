import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { CurrencyManager } from '../../modules/economy/currency-manager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('Verifica o seu saldo de moedas.'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const balance = await CurrencyManager.getBalance(interaction.guild.id, interaction.user.id);
    const currencyName = await CurrencyManager.getCurrencyName(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`💰 **${interaction.user.username}**, você possui **${balance} ${currencyName}**.`);

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
