import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurações do servidor.')
    .addSubcommand(sub => 
      sub.setName('moeda')
        .setDescription('Define o nome da moeda virtual')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome da moeda').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('xp')
        .setDescription('Configura ganho de XP')
        .addStringOption(opt => 
          opt.setName('tipo')
            .setDescription('Tipo de ação')
            .setRequired(true)
            .addChoices({name: 'Mensagem', value: 'msg'}, {name: 'Reação', value: 'react'}, {name: 'Voz', value: 'voice'})
        )
        .addIntegerOption(opt => opt.setName('min').setDescription('XP Mínimo').setRequired(true))
        .addIntegerOption(opt => opt.setName('max').setDescription('XP Máximo').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('age-gate')
        .setDescription('Define mínimo de dias para conta')
        .addIntegerOption(opt => opt.setName('dias').setDescription('Dias (0 para desativar)').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('antiraid')
        .setDescription('Configura limiares do Anti-Raid')
        .addIntegerOption(opt => opt.setName('entradas').setDescription('Entradas').setRequired(true))
        .addIntegerOption(opt => opt.setName('segundos').setDescription('Janela de tempo em segundos').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const guildId = BigInt(interaction.guild!.id);

    // Garantir que config existe
    await prisma.serverConfig.upsert({
      where: { guildId },
      update: {},
      create: { guildId },
    });

    if (subCmd === 'moeda') {
      const nome = interaction.options.getString('nome', true);
      await prisma.serverConfig.update({
        where: { guildId },
        data: { currencyName: nome },
      });
      await interaction.reply(`Nome da moeda definido para **${nome}**.`);
    } else if (subCmd === 'xp') {
      const tipo = interaction.options.getString('tipo', true);
      const min = interaction.options.getInteger('min', true);
      const max = interaction.options.getInteger('max', true);
      
      const updateData: any = {};
      if (tipo === 'msg') { updateData.xpMessageMin = min; updateData.xpMessageMax = max; }
      else if (tipo === 'react') { updateData.xpReactionMin = min; updateData.xpReactionMax = max; }
      else if (tipo === 'voice') { updateData.xpVoiceMin = min; updateData.xpVoiceMax = max; }

      await prisma.serverConfig.update({ where: { guildId }, data: updateData });
      await interaction.reply(`XP para **${tipo}** atualizado: Min ${min} | Max ${max}.`);
    } else if (subCmd === 'age-gate') {
      const dias = interaction.options.getInteger('dias', true);
      await prisma.serverConfig.update({ where: { guildId }, data: { minAccountAgeDays: dias } });
      await interaction.reply(`Idade mínima da conta definida para **${dias} dias**.`);
    } else if (subCmd === 'antiraid') {
      const entradas = interaction.options.getInteger('entradas', true);
      const segundos = interaction.options.getInteger('segundos', true);
      await prisma.serverConfig.update({ where: { guildId }, data: { antiraidJoins: entradas, antiraidSeconds: segundos } });
      await interaction.reply(`Anti-Raid configurado para ativar se houver **${entradas} entradas** em **${segundos} segundos**.`);
    }
  },
};

export default command;
