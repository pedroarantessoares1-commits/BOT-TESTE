import { SlashCommandBuilder, ChatInputCommandInteraction, ClientEvents } from 'discord.js';
import { CustomClient } from '../client';

export interface SlashCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: CustomClient) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}
