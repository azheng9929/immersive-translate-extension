export type ContentMessage =
  | { type: "IMT_TRANSLATE_PAGE" }
  | { type: "IMT_RESTORE_PAGE" };

export type BackgroundMessage =
  | { type: "IMT_POPUP_TRANSLATE_ACTIVE_TAB" }
  | { type: "IMT_POPUP_RESTORE_ACTIVE_TAB" };

export type MessageResponse = { ok: true } | { ok: false; error: string };
