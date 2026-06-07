import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('conquista')
    .setDescription('Gerencia conquistas.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona conquista')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome').setRequired(true))
        .addStringOption(opt => opt.setName('tipo').setDescription('Tipo da condição').setRequired(true).addChoices({name: 'Level', value:'level'}, {name:'Mensagens', value:'messages'}))
        .addIntegerOption(opt => opt.setName('valor').setDescription('Valor da condição').setRequired(true))
        .addIntegerOption(opt => opt.setName('recompensa').setDescription('Coins').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === 'add') {
      await prisma.achievement.create({
        data: {
          guildId: BigInt(interaction.guild!.id),
          name: interaction.options.getString('nome', true),
          conditionType: interaction.options.getString('tipo', true),
          conditionValue: interaction.options.getInteger('valor', true),
          rewardCoins: interaction.options.getInteger('recompensa', true),
        }
      });
      await interaction.reply('Conquista adicionada.');
    }
  },
};

export default command;
