import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types';
import { ShopManager } from '../../modules/economy/shop-manager';
import { TransactionHandler } from '../../modules/economy/transaction-handler';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Compra um item da loja.')
    .addIntegerOption(option => 
      option.setName('id')
        .setDescription('ID do item que deseja comprar')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    await interaction.deferReply({ ephemeral: true });

    const itemId = interaction.options.getInteger('id', true);
    const item = await ShopManager.getItem(itemId);

    if (!item || item.guildId.toString() !== interaction.guild.id || !item.isActive) {
      return interaction.editReply('Item inválido ou não disponível.');
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const result = await TransactionHandler.purchaseItem(member, item);

    await interaction.editReply(result.message);
  },
};

export default command;
