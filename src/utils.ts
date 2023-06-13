import { Logger } from "replugged";
import { PlatformIndicatorsSettings } from "./interfaces";
import { cfg } from ".";

export const logger = Logger.plugin("PlatformIndicators");

export const debugLog = (debug: boolean, msg: string, ...args: unknown[]): void => {
  if (debug) logger.log(`[DEBUG] ${msg}`, ...args);
  else logger.log(msg, ...args);
};

export function resetSettings(): void {
  logger.log("Resetting settings");

  // remove old settings
  for (const key of Object.keys(cfg.all())) {
    cfg.delete(key as keyof PlatformIndicatorsSettings);
  }

  // add new settings
  addNewSettings();

  cfg.set("resetSettings", false);
}

export function addNewSettings(): void {
  for (const [key, value] of Object.entries(PlatformIndicatorsSettings)) {
    if (!cfg.has(key as keyof PlatformIndicatorsSettings)) {
      logger.log(`Adding new setting ${key} with value`, value);
      cfg.set(key as keyof PlatformIndicatorsSettings, value as never);
    }
  }
}
