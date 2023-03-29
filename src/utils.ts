import { Logger } from "replugged";

export const logger = Logger.plugin("PlatformIndicators");

export const debugLog = (debug: boolean, msg: string, ...args: unknown[]): void => {
  if (debug) logger.log(`[DEBUG] ${msg}`, ...args);
  else logger.log(msg, ...args);
};
