const PAGE_CONTROL_MESSAGE_TYPES = new Set([
  "IMT_TRANSLATE_PAGE",
  "IMT_RESTORE_PAGE",
  "IMT_SET_PAGE_RENDER_STATE",
  "IMT_GET_PAGE_STATUS",
  "IMT_CONFIG_UPDATED",
]);

export function shouldHandleContentMessage(message: unknown, isTopFrame: boolean): boolean {
  if (!isPageControlMessage(message)) return true;
  return isTopFrame;
}

export function isPageControlMessage(message: unknown): boolean {
  return isRecord(message) && typeof message.type === "string" && PAGE_CONTROL_MESSAGE_TYPES.has(message.type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
