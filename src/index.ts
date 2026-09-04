import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import { commands } from "./commands.js";
import { config } from "./config.js";
import { runServerAction, sendServerCommand, type ServerAction } from "./crafty.js";
import { minecraftTellraw } from "./minecraft.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

function canControl(interaction: ChatInputCommandInteraction): boolean {
  if (config.discord.controlUserIds.has(interaction.user.id)) return true;
  const member = interaction.member as GuildMember | null;
  return member ? [...config.discord.controlRoleIds].some((roleId) => member.roles.cache.has(roleId)) : false;
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "server") return;

  if (!canControl(interaction)) {
    await interaction.reply({ content: "You are not allowed to control the Minecraft server.", flags: MessageFlags.Ephemeral });
    return;
  }

  const action = interaction.options.getSubcommand(true) as ServerAction;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const output = await runServerAction(action);
    await interaction.editReply(`Server **${action}** command completed.\n\`\`\`\n${output.slice(0, 1_700)}\n\`\`\``);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    await interaction.editReply(`Could not ${action} the server: ${message.slice(0, 1_700)}`);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.channelId !== config.discord.chatChannelId || !message.inGuild()) return;
  if (!message.content.trim()) return;

  try {
    await sendServerCommand(minecraftTellraw(message.member?.displayName ?? message.author.username, message.content));
    await message.react("✅").catch(() => undefined);
  } catch (error) {
    console.error("Could not relay Discord message through Crafty:", error);
    await message.react("❌").catch(() => undefined);
  }
});

client.on(Events.Error, console.error);

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down.`);
  client.destroy();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

const rest = new REST({ version: "10" }).setToken(config.discord.token);
await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), { body: commands });
console.log(`Registered ${commands.length} Discord command(s).`);
await client.login(config.discord.token);
