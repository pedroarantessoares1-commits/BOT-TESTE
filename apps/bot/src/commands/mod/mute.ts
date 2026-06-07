import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';
import { ModLog } from '../../modules/logging/mod-log';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Aplica mute temporário (timeout) a um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a mutar').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutos').setDescription('Duração em minutos').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do mute').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);
    const minutes = interaction.options.getInteger('minutos', true);
    const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';

    const member = await interaction.guild?.members.fetch(user.id);
    if (!member) return interaction.reply({ content: 'Membro não encontrado.', ephemeral: true });

    try {
      await member.timeout(minutes * 60 * 1000, reason);
      await ModLog.logEvent(interaction.guild!.id, 'mute', {
        targetUserId: user.id,
        moderatorId: interaction.user.id,
        reason: `${reason} (Duração: ${minutes}m)`,
      });
      await interaction.reply(`O usuário <@${user.id}> foi mutado por ${minutes} minutos.`);
    } catch (err) {
      await interaction.reply({ content: 'Falha ao mutar o membro. Verifique as permissões da hierarquia de cargos.', ephemeral: true });
    }
  },
};

export default command;
