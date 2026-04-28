import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, normalizeExtensionConfigPatch, type ExtensionConfig, type ExtensionConfigPatch } from "../shared/config";

type StorageAreaLike = {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
};

const CONFIG_KEY = "imt-extension-config";

export function createConfigStore(storageArea: StorageAreaLike = chrome.storage.local) {
  return {
    async load(): Promise<ExtensionConfig> {
      const result = await storageArea.get(CONFIG_KEY);
      return normalizeExtensionConfig(result[CONFIG_KEY]);
    },

    async update(patch: unknown): Promise<ExtensionConfig> {
      const current = await this.load();
      const normalizedPatch = normalizeExtensionConfigPatch(patch);
      const next = normalizeExtensionConfig({ ...current, ...normalizedPatch });
      await storageArea.set({ [CONFIG_KEY]: next });
      return next;
    },

    async reset(): Promise<ExtensionConfig> {
      await storageArea.set({ [CONFIG_KEY]: DEFAULT_EXTENSION_CONFIG });
      return DEFAULT_EXTENSION_CONFIG;
    },
  };
}

export type ConfigStore = ReturnType<typeof createConfigStore>;
export type { ExtensionConfig, ExtensionConfigPatch };
