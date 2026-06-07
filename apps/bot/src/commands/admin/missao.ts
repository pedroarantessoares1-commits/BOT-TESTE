import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('missao')
    .setDescription('Gerencia missões.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona missão')
        .addStringOption(opt => opt.setName('tipo').setDescription('Tipo').setRequired(true).addChoices({name:'Diária', value:'daily'}, {name:'Semanal', value:'weekly'}))
        .addStringOption(opt => opt.setName('descricao').setDescription('Descrição').setRequired(true))
        .addStringOption(opt => opt.setName('objetivo').setDescription('Objetivo').setRequired(true).addChoices({name:'Mensagens', value:'messages'}, {name:'Voz', value:'voice_minutes'}))
        .addIntegerOption(opt => opt.setName('valor').setDescription('Valor').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === 'add') {
      await prisma.mission.create({
        data: {
          guildId: BigInt(interaction.guild!.id),
          type: interaction.options.getString('tipo', true),
          description: interaction.options.getString('descricao', true),
          objectiveType: interaction.options.getString('objetivo', true),
          objectiveValue: interaction.options.getInteger('valor', true),
        }
      });
      await interaction.reply('Missão adicionada.');
    }
  },
};

export default command;
