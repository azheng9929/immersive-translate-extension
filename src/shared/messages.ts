import type { ProviderRequest, ProviderResponseItem } from "../background/providers/providerTypes";

export type ContentMessage =
  | { type: "IMT_TRANSLATE_PAGE" }
  | { type: "IMT_RESTORE_PAGE" };

export type BackgroundMessage =
  | { type: "IMT_POPUP_TRANSLATE_ACTIVE_TAB" }
  | { type: "IMT_POPUP_RESTORE_ACTIVE_TAB" }
  | { type: "IMT_TRANSLATE_BATCH"; request: ProviderRequest };

export type MessageResponse =
  | { ok: true }
  | { ok: true; items: ProviderResponseItem[] }
  | { ok: false; error: string };
