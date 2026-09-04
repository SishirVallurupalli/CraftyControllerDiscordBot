import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function ids(name: string): ReadonlySet<string> {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export const config = {
  discord: {
    token: required("DISCORD_TOKEN"),
    clientId: required("DISCORD_CLIENT_ID"),
    guildId: required("DISCORD_GUILD_ID"),
    chatChannelId: required("CHAT_CHANNEL_ID"),
    controlUserIds: ids("CONTROL_USER_IDS"),
    controlRoleIds: ids("CONTROL_ROLE_IDS"),
  },
  crafty: {
    url: required("CRAFTY_URL").replace(/\/$/, ""),
    apiToken: required("CRAFTY_API_TOKEN"),
    serverId: required("CRAFTY_SERVER_ID"),
    allowSelfSigned: process.env.CRAFTY_ALLOW_SELF_SIGNED?.toLowerCase() === "true",
  },
} as const;
