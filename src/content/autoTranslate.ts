import type { ExtensionConfig } from "../shared/config";

type AutoTranslateLocation = {
  protocol?: string;
};

type AutoTranslateOptions = {
  location?: AutoTranslateLocation;
  delayMs?: number;
};

export type AutoTranslateRunner = () => void | Promise<unknown>;

export function shouldAutoTranslatePage(
  config: Pick<ExtensionConfig, "autoTranslate">,
  location: AutoTranslateLocation = window.location,
): boolean {
  if (!config.autoTranslate) return false;
  return location.protocol === "http:" || location.protocol === "https:";
}

export function scheduleAutoTranslate(
  config: Pick<ExtensionConfig, "autoTranslate">,
  run: AutoTranslateRunner,
  options: AutoTranslateOptions = {},
): (() => void) | undefined {
  const location = options.location ?? window.location;
  if (!shouldAutoTranslatePage(config, location)) return undefined;

  const delayMs = options.delayMs ?? 250;
  const timer = window.setTimeout(() => {
    void Promise.resolve(run()).catch((error) => {
      console.warn("[IMT] Auto translate failed", error);
    });
  }, delayMs);

  return () => window.clearTimeout(timer);
}
