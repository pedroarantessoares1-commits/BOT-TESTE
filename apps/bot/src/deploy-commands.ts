import { REST, Routes } from 'discord.js';
import { config } from './config';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './lib/logger';

const commands: any[] = [];
const commandsPath = join(__dirname, 'commands');

try {
  const commandFolders = readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = join(folderPath, file);
      const commandModule = require(filePath);
      const command = commandModule.default || commandModule;
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  const rest = new REST().setToken(config.DISCORD_TOKEN);

  (async () => {
    try {
      logger.info(`Started refreshing ${commands.length} application (/) commands.`);

      const data: any = await rest.put(
        Routes.applicationCommands(config.DISCORD_CLIENT_ID),
        { body: commands },
      );

      logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      logger.error(error);
    }
  })();
} catch (err) {
  logger.error(`Error deploying commands: ${err}`);
}
