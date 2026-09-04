import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { config } from "./config.js";

const rest = new REST({ version: "10" }).setToken(config.discord.token);
await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), {
  body: commands,
});
console.log(`Registered ${commands.length} guild command(s).`);
