export function minecraftTellraw(username: string, message: string): string {
  const safeName = username.replace(/[\r\n]/g, " ").slice(0, 80);
  const safeMessage = message.replace(/[\r\n]/g, " ").slice(0, 500);
  const component = [
    { text: "[Discord] ", color: "blue" },
    { text: `${safeName}: `, color: "aqua" },
    { text: safeMessage, color: "white" },
  ];
  return `tellraw @a ${JSON.stringify(component)}`;
}
