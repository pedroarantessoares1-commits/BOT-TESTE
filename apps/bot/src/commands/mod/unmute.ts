import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove o mute temporário de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a desmutar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);
    const member = await interaction.guild?.members.fetch(user.id);
    if (!member) return interaction.reply({ content: 'Membro não encontrado.', ephemeral: true });

    try {
      await member.timeout(null, 'Unmute via comando');
      await interaction.reply(`O usuário <@${user.id}> foi desmutado.`);
    } catch (err) {
      await interaction.reply({ content: 'Falha ao desmutar o membro.', ephemeral: true });
    }
  },
};

export default command;
