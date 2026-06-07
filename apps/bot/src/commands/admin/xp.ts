import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { LevelManager } from '../../modules/rpg/level-manager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Adiciona ou remove XP de um usuário.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona XP')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove XP')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuario', true);
    const amount = interaction.options.getInteger('quantidade', true);

    if (subCmd === 'add') {
      await LevelManager.processXpGain(interaction.guild!.id, user.id, amount, 0);
      await interaction.reply(`Adicionado **${amount}** XP para <@${user.id}>.`);
    } else {
      await LevelManager.processXpGain(interaction.guild!.id, user.id, -amount, 0); // Hack simples para remover, mas no mundo real faria check
      await interaction.reply(`Removido **${amount}** XP de <@${user.id}>.`);
    }
  },
};

export default command;
