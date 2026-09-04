import https from "node:https";
import { config } from "./config.js";

export type ServerAction = "start" | "stop" | "restart" | "status";

type CraftyResponse = {
  status?: string;
  error?: string;
  error_data?: unknown;
  data?: Record<string, unknown>;
};

function request(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown> | string,
  contentType = "application/json",
): Promise<CraftyResponse> {
  const url = new URL(path, `${config.crafty.url}/`);
  if (url.protocol !== "https:") {
    throw new Error("CRAFTY_URL must use HTTPS");
  }

  return new Promise((resolve, reject) => {
    const payload = typeof body === "string" ? body : body ? JSON.stringify(body) : undefined;
    const req = https.request(
      url,
      {
        method,
        headers: {
          Authorization: `Bearer ${config.crafty.apiToken}`,
          Accept: "application/json",
          ...(payload ? { "Content-Type": contentType, "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        rejectUnauthorized: !config.crafty.allowSelfSigned,
        timeout: 30_000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          let parsed: CraftyResponse = {};
          try {
            parsed = body ? (JSON.parse(body) as CraftyResponse) : {};
          } catch {
            reject(new Error(`Crafty returned a non-JSON response (HTTP ${response.statusCode ?? "unknown"})`));
            return;
          }

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300 || parsed.status === "error") {
            const detail = parsed.error_data ?? parsed.error ?? body;
            reject(new Error(`Crafty API error (HTTP ${response.statusCode ?? "unknown"}): ${String(detail)}`));
            return;
          }
          resolve(parsed);
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Crafty API request timed out")));
    req.on("error", reject);
    req.end(payload);
  });
}

export async function sendServerCommand(command: string): Promise<void> {
  const serverId = encodeURIComponent(config.crafty.serverId);
  await request("POST", `api/v2/servers/${serverId}/stdin`, command, "text/plain");
}

export async function runServerAction(action: ServerAction): Promise<string> {
  const serverId = encodeURIComponent(config.crafty.serverId);
  if (action === "status") {
    const response = await request("GET", `api/v2/servers/${serverId}/stats`);
    const data = response.data ?? {};
    const nested = data[config.crafty.serverId];
    const stats: Record<string, unknown> = {
      ...response,
      ...data,
      ...(typeof nested === "object" && nested !== null ? nested : {}),
    };
    const running = stats.running ?? stats.online ?? stats.status;
    const players = stats.online_players ?? stats.online ?? stats.players;
    const version = stats.version;
    return [
      running === undefined ? undefined : `State: ${String(running)}`,
      players === undefined ? undefined : `Players: ${String(players)}`,
      version === undefined ? undefined : `Version: ${String(version)}`,
    ].filter(Boolean).join("\n") || JSON.stringify(stats, null, 2).slice(0, 1_500);
  }

  await request("POST", `api/v2/servers/${serverId}/action/${action}_server`);
  return `Crafty accepted the ${action} request.`;
}
