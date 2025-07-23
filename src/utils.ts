import { Injector, Logger, settings, util } from "replugged";
import { PlatformIndicatorsSettings } from "./interfaces";

export const inject = new Injector();
export const cfg = settings.init<
  PlatformIndicatorsSettings,
  keyof typeof PlatformIndicatorsSettings
>("me.puyodead1.PlatformIndicators");

export const logger = Logger.plugin("PlatformIndicators");

export const debugLog = (debug: boolean, msg: string, ...args: unknown[]): void => {
  if (debug) logger.log(`[DEBUG] ${msg}`, ...args);
  else logger.log(msg, ...args);
};
export const moduleFindFailed = (name: string): boolean => {
  logger.error(`Module ${name} not found!`);
  return false;
};
export const functionNameFindFailed = (mod: string): boolean => {
  logger.error(`Failed to find ${mod} function name!`);
  return false;
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
export function forceRerenderElement(selector: string): void {
  const element = document.querySelector(selector);
  if (!element) return;
  const ownerInstance = util.getOwnerInstance(element);
  const unpatchRender = inject.instead(ownerInstance, "render", () => {
    unpatchRender();
    return null;
  });
  ownerInstance.forceUpdate(() => ownerInstance.forceUpdate(() => {}));
}
