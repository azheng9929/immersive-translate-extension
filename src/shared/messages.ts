import type { ProviderRequest, ProviderResponseItem } from "../background/providers/providerTypes";
import type { PageTranslationStatus } from "../content/pageTranslationSession";
import type { ExtensionConfig, ExtensionConfigPatch } from "./config";
import type { WebTranslationRule } from "./webRuleTypes";

export type ContentMessage =
  | { type: "IMT_TRANSLATE_PAGE" }
  | { type: "IMT_RESTORE_PAGE" }
  | { type: "IMT_GET_PAGE_STATUS" }
  | { type: "IMT_CONFIG_UPDATED"; config: ExtensionConfig };

export type BackgroundMessage =
  | { type: "IMT_POPUP_TRANSLATE_ACTIVE_TAB" }
  | { type: "IMT_POPUP_RESTORE_ACTIVE_TAB" }
  | { type: "IMT_POPUP_GET_ACTIVE_TAB_STATUS" }
  | { type: "IMT_TRANSLATE_BATCH"; request: ProviderRequest }
  | { type: "IMT_GET_CONFIG" }
  | { type: "IMT_GET_WEB_RULES"; url: string }
  | { type: "IMT_UPDATE_CONFIG"; patch: ExtensionConfigPatch };

export type MessageResponse =
  | { ok: true }
  | { ok: true; items: ProviderResponseItem[] }
  | { ok: true; config: ExtensionConfig }
  | { ok: true; webRules: WebTranslationRule[] }
  | { ok: true; status: PageTranslationStatus }
  | { ok: false; error: string };
