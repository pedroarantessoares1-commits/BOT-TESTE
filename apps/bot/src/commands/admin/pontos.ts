import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { CurrencyManager } from '../../modules/economy/currency-manager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('pontos')
    .setDescription('Adiciona ou remove pontos de um usuário.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona pontos')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove pontos')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuario', true);
    const amount = interaction.options.getInteger('quantidade', true);

    if (subCmd === 'add') {
      await CurrencyManager.addCoins(interaction.guild!.id, user.id, amount);
      await interaction.reply(`Adicionado **${amount}** pontos para <@${user.id}>.`);
    } else {
      const success = await CurrencyManager.removeCoins(interaction.guild!.id, user.id, amount);
      if (success) {
        await interaction.reply(`Removido **${amount}** pontos de <@${user.id}>.`);
      } else {
        await interaction.reply(`Falha. O usuário não tem pontos suficientes.`);
      }
    }
  },
};

export default command;
