import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';
import { IpBanManager } from '../../modules/security/ip-ban-manager';
import { ModLog } from '../../modules/logging/mod-log';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ipban')
    .setDescription('Gerencia banimentos de IP.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Bane o IP de um usuário e todas as contas associadas')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do banimento').setRequired(false))
    )
    .addSubcommand(sub => 
      sub.setName('list')
        .setDescription('Lista IPs banidos (hasheados)')
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove o banimento de um IP (hash)')
        .addStringOption(opt => opt.setName('hash').setDescription('Hash do IP').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (subCmd === 'add') {
      const user = interaction.options.getUser('usuario', true);
      const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';

      const count = await IpBanManager.banUserIps(guildId, user.id, interaction.user.id, reason);
      
      try {
        await interaction.guild!.members.ban(user, { reason: `IP Ban: ${reason}` });
      } catch (e) {} // Ignorar se já banido

      await ModLog.logEvent(guildId, 'ipban', {
        targetUserId: user.id,
        moderatorId: interaction.user.id,
        reason,
        details: { ipsBanned: count }
      });

      await interaction.reply(`Usuário banido. **${count}** IPs vinculados foram bloqueados.`);
    } else if (subCmd === 'list') {
      const bans = await prisma.bannedIp.findMany({ where: { guildId: BigInt(guildId) } });
      
      const embed = new EmbedBuilder().setTitle('IPs Banidos (Hashes)').setColor('#000000');
      if (bans.length === 0) embed.setDescription('Nenhum IP banido.');
      else {
        bans.forEach(b => embed.addFields({ name: `Hash ID: ${b.id}`, value: `User Original: <@${b.originalUserId}>\nMotivo: ${b.reason}` }));
      }
      await interaction.reply({ embeds: [embed] });
    } else if (subCmd === 'remove') {
      const hash = interaction.options.getString('hash', true);
      await prisma.bannedIp.deleteMany({ where: { guildId: BigInt(guildId), ipHash: hash } });
      await interaction.reply('IP removido da blocklist.');
    }
  },
};

export default command;
