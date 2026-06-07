import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { prisma } from '../../lib/database';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Gerencia a whitelist do Account Age Gate.')
    .addSubcommand(sub => 
      sub.setName('add')
        .setDescription('Adiciona um usuário à whitelist')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo'))
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove um usuário da whitelist')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCmd = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuario', true);
    const guildId = BigInt(interaction.guild!.id);
    const userId = BigInt(user.id);

    if (subCmd === 'add') {
      const reason = interaction.options.getString('motivo');
      await prisma.accountWhitelist.upsert({
        where: { guildId_userId: { guildId, userId } },
        update: { reason, addedBy: BigInt(interaction.user.id) },
        create: { guildId, userId, addedBy: BigInt(interaction.user.id), reason },
      });
      await interaction.reply(`O usuário <@${user.id}> foi adicionado à whitelist.`);
    } else if (subCmd === 'remove') {
      await prisma.accountWhitelist.deleteMany({
        where: { guildId, userId }
      });
      await interaction.reply(`O usuário <@${user.id}> foi removido da whitelist.`);
    }
  },
};

export default command;
