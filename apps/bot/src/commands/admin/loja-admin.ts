import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('loja-admin')
    .setDescription('Gerencia os itens da loja.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona item')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do item').setRequired(true))
        .addIntegerOption(opt => opt.setName('preco').setDescription('Preço em coins').setRequired(true))
        .addStringOption(opt => opt.setName('tipo').setDescription('Tipo').setRequired(true).addChoices(
          { name: 'Cargo Permanente', value: 'role_permanent' },
          { name: 'Cargo Temporário', value: 'role_temporary' },
          { name: 'Cargo de Farm (Temporada)', value: 'role_seasonal' },
          { name: 'Badge', value: 'badge' },
          { name: 'XP Booster', value: 'xp_booster' }
        ))
        .addStringOption(opt => opt.setName('valor').setDescription('Role ID, badge URL, etc').setRequired(true))
        .addStringOption(opt => opt.setName('desc').setDescription('Descrição').setRequired(false))
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove item')
        .addIntegerOption(opt => opt.setName('id').setDescription('ID do item').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const guildId = BigInt(interaction.guild!.id);

    if (subCmd === 'add') {
      const nome = interaction.options.getString('nome', true);
      const preco = interaction.options.getInteger('preco', true);
      const tipo = interaction.options.getString('tipo', true);
      const valor = interaction.options.getString('valor', true);
      const desc = interaction.options.getString('desc');

      const item = await prisma.shopItem.create({
        data: { guildId, name: nome, price: preco, itemType: tipo, itemValue: valor, description: desc }
      });
      await interaction.reply(`Item **${item.name}** adicionado com ID **${item.id}**.`);
    } else if (subCmd === 'remove') {
      const id = interaction.options.getInteger('id', true);
      await prisma.shopItem.delete({ where: { id } }).catch(() => null);
      await interaction.reply(`Item ${id} removido.`);
    }
  },
};

export default command;
