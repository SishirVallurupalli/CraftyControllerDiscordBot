# Discord Minecraft Controller

A Discord bot that:

- lets approved Discord users or roles run `/server start`, `/server stop`, `/server restart`, and `/server status`;
- relays messages from one Discord channel to all online Minecraft players through Crafty's command API;
- controls the server through Crafty Controller's authenticated API.

## Requirements

- Node.js 20 or newer
- A Discord application/bot
- Crafty Controller 4 with API access to the Minecraft server

## 1. Configure Discord

Create an application and bot in the Discord Developer Portal. Enable the **Message Content Intent** under the bot's privileged gateway intents. Invite it with the `bot` and `applications.commands` scopes and these permissions:

- View Channels
- Send Messages
- Read Message History
- Add Reactions
- Use Application Commands

Turn on Discord Developer Mode, then copy the server, channel, user, and/or role IDs you want to use.

## 2. Configure Crafty and install

In Crafty, create a dedicated bot user/role with access only to the target server and the **Commands** permission, then create an API key. Copy the server UUID from the Crafty dashboard URL.

```bash
npm install
cp .env.example .env
```

Fill in `.env`. Set `CRAFTY_URL=https://crafty:8443` when the Crafty Compose service is named `crafty`. If Crafty uses its default self-signed certificate, set `CRAFTY_ALLOW_SELF_SIGNED=true` only while both services are isolated on a private Docker network.

## 3. Build and run

```bash
npm run build
npm start
```

The bot registers its guild slash commands each time it starts, so they normally appear immediately. For development, use `npm run dev`.

For Docker, copy `compose.example.yml` beside the project, add the same named network to your Crafty service, and run:

```bash
docker compose -f compose.example.yml up -d --build
```

## Notes

- Every non-bot text message in `CHAT_CHANNEL_ID` is relayed to Minecraft. Discord-only conversation should use another channel.
- A ✅ reaction means Crafty accepted the message; ❌ means the server was unavailable or the relay failed.
- Attachments and embeds are not relayed.
- Discord messages are limited to 500 characters when sent to Minecraft.
- The bot and Crafty containers must share a Docker network; do not mount the Docker socket into this bot.
