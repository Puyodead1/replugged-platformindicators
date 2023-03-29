import { webpack } from "replugged";
import { AnyFunction, ObjectExports } from "replugged/dist/types";
import { PresenceStore, SessionStore } from "./interfaces";
import { debugLog, logger } from "./utils";

const STATUS_COLOR_REGEX = /case\s\w+\.\w+\.ONLINE:.+case\s\w+\.\w+\.IDLE:/;

const moduleFindFailed = (name: string): void => logger.error(`Module ${name} not found!`);

export const modules: {
  SessionStore: SessionStore | null;
  init: (debug: boolean) => Promise<void>;
} = {
  SessionStore: null,
  init: async (debug) => {
    debugLog(debug, "Waiting for SessionStore module");
    modules.SessionStore = await webpack.waitForModule<SessionStore>(
      webpack.filters.byProps("getActiveSession"),
      {
        timeout: 10000,
      },
    );
    if (!modules.SessionStore) return moduleFindFailed("SessionStore");

    debugLog(debug, "Waiting for PresenceStore module");
    const PresenceStore = await webpack.waitForModule<PresenceStore>(
      webpack.filters.byProps("setCurrentUserOnConnectionOpen"),
      {
        timeout: 10000,
      },
    );
    if (!PresenceStore) return moduleFindFailed("PresenceStore");

    debugLog(debug, "Waiting for color constants module");
    const getStatusColorMod = await webpack.waitForModule<Record<string, string>>(
      webpack.filters.bySource(STATUS_COLOR_REGEX),
      {
        timeout: 10000,
      },
    );
    if (!getStatusColorMod) return moduleFindFailed("getStatusColorMod");
    const getStatusColor = webpack.getFunctionBySource<(status: string) => string>(
      getStatusColorMod,
      STATUS_COLOR_REGEX,
    );
    if (!getStatusColor) return moduleFindFailed("getStatusColor");

    debugLog(debug, "Waiting for profile badge classes module");
    const profileBadgeMod = await webpack.waitForModule<Record<string, string>>(
      webpack.filters.byProps("profileBadge24"),
      {
        timeout: 10000,
      },
    );
    if (!profileBadgeMod) return moduleFindFailed("profileBadgeMod");

    debugLog(debug, "Waiting for userStateFromStore module");
    const useStateFromStoreMod = await webpack.waitForModule<ObjectExports>(
      webpack.filters.bySource("useStateFromStore"),
      {
        timeout: 10000,
      },
    );
    if (!useStateFromStoreMod) return moduleFindFailed("useStateFromStoreMod");

    const usfsFnName = webpack.getFunctionKeyBySource(useStateFromStoreMod, "useStateFromStore")!;
    if (!usfsFnName) return logger.error("Failed to get function name for useStateFromStoreMod");

    const useStateFromStore = useStateFromStoreMod[usfsFnName];

    debugLog(debug, "Waiting for injection point module");
    const injectionModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.bySource(/\w+.withMentionPrefix,\w+=void\s0!==\w/), {
      timeout: 10000,
    });
    if (!injectionModule) return moduleFindFailed("injectionModule");

    const fnName = Object.entries(injectionModule).find(([_, v]) =>
      v.toString()?.match(/.withMentionPrefix/),
    )?.[0];
    if (!fnName) return logger.error("Failed to get function name");
  },
};
