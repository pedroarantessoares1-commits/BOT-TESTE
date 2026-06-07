import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: join(__dirname, '../.env') });

import { readdirSync } from 'fs';
import { CustomClient } from './client';
import { config } from './config';
import { logger } from './lib/logger';
import { BotEvent } from './types';

async function bootstrap() {
  const client = new CustomClient();

  // Load commands
  const commandsPath = join(__dirname, 'commands');
  try {
    const commandFolders = readdirSync(commandsPath);
    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        const command = commandModule.default || commandModule;
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }
  } catch (err) {
    logger.warn(`No commands directory found or error loading commands: ${err}`);
  }

  // Load events
  const eventsPath = join(__dirname, 'events');
  try {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const eventModule = await import(pathToFileURL(filePath).href);
      const event: BotEvent<any> = eventModule.default || eventModule;
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  } catch (err) {
    logger.warn(`No events directory found or error loading events: ${err}`);
  }

  // Handle interactions (slash commands)
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
      }
    }
  });

  console.log('Token presente:', !!process.env.DISCORD_TOKEN);
  client.login(config.DISCORD_TOKEN).catch(err => {
    logger.error('Failed to login to Discord:', err);
    console.error('Detalhes do erro de login:', err);
    process.exit(1);
  });
}

bootstrap();
