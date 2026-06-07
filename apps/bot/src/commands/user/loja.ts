import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { ShopManager } from '../../modules/economy/shop-manager';
import { CurrencyManager } from '../../modules/economy/currency-manager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('loja')
    .setDescription('Visualiza os itens disponíveis na loja do servidor.'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const items = await ShopManager.getItems(interaction.guild.id);
    const currencyName = await CurrencyManager.getCurrencyName(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('🛒 Loja do Servidor')
      .setColor('#2F3136')
      .setDescription(items.length === 0 ? 'A loja está vazia no momento.' : 'Use `/comprar <id>` para adquirir um item.');

    for (const item of items) {
      embed.addFields({
        name: `ID: ${item.id} | ${item.name}`,
        value: `${item.description || 'Sem descrição'}\nPreço: **${item.price} ${currencyName}**${item.stock !== null ? ` | Estoque: ${item.stock}` : ''}`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
