import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';
import { Queue } from 'bullmq';
import { config } from '../../config';

const roleQueue = new Queue('RoleBulkQueue', { connection: { url: config.REDIS_URL } });

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('cargo')
    .setDescription('Gerenciamento de cargos em massa.')
    .addSubcommand(sub => 
      sub.setName('add-all')
        .setDescription('Adiciona um cargo a todos os membros')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a adicionar').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('remove-all')
        .setDescription('Remove um cargo de todos os membros')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a remover').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('audit')
        .setDescription('Lista membros com o cargo')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('list-level')
        .setDescription('Lista membros em um determinado nível')
        .addIntegerOption(opt => opt.setName('nivel').setDescription('Nível').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (subCmd === 'add-all' || subCmd === 'remove-all') {
      const role = interaction.options.getRole('cargo', true);
      const action = subCmd === 'add-all' ? 'add' : 'remove';

      await roleQueue.add('bulkRole', { guildId, roleId: role.id, action });
      await interaction.reply(`Operação de ${action === 'add' ? 'adição' : 'remoção'} do cargo **${role.name}** iniciada em background. Isso pode demorar para servidores grandes.`);
    } else if (subCmd === 'audit') {
      const role = interaction.options.getRole('cargo', true);
      const members = interaction.guild!.members.cache.filter(m => m.roles.cache.has(role.id));
      
      const embed = new EmbedBuilder()
        .setTitle(`Auditoria de Cargo: ${role.name}`)
        .setColor('#2F3136')
        .setDescription(`**Total de membros:** ${members.size}\n` + members.map(m => `<@${m.id}>`).slice(0, 50).join(', '));
      
      await interaction.reply({ embeds: [embed] });
    } else if (subCmd === 'list-level') {
      const level = interaction.options.getInteger('nivel', true);
      const users = await prisma.user.findMany({
        where: { guildId: BigInt(guildId), level },
        select: { id: true }
      });

      const embed = new EmbedBuilder()
        .setTitle(`Membros no Nível ${level}`)
        .setColor('#FFD700')
        .setDescription(`**Total de membros:** ${users.length}\n` + users.map(u => `<@${u.id}>`).slice(0, 50).join(', '));
      
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
