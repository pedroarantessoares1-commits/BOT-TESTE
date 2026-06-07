import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { SlashCommand } from './types';

export class CustomClient extends Client {
  public commands: Collection<string, SlashCommand>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
      ],
    });

    this.commands = new Collection();
  }
}
