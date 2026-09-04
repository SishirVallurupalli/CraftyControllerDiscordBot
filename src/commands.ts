import { SlashCommandBuilder } from "discord.js";

export const serverCommand = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Control the Minecraft server")
  .addSubcommand((command) => command.setName("start").setDescription("Start the server"))
  .addSubcommand((command) => command.setName("stop").setDescription("Stop the server"))
  .addSubcommand((command) => command.setName("restart").setDescription("Restart the server"))
  .addSubcommand((command) => command.setName("status").setDescription("Check server status"));

export const commands = [serverCommand.toJSON()];
