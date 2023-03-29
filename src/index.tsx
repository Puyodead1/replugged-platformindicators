/* eslint-disable */
import { User } from "discord-types/general";
import { common, components, Injector, settings, webpack } from "replugged";
import { AnyFunction, ObjectExports } from "replugged/dist/types";
import platformIndicator from "./Components/PlatformIndicator";
import {
  ClientStatus,
  PlatformIndicatorsSettings,
  PresenceStore,
  SessionStore,
} from "./interfaces";
import "./style.css";
import { debugLog, logger } from "./utils";

const inject = new Injector();
const { fluxDispatcher } = common;
const { ErrorBoundary } = components;
const EVENT_NAME = "PRESENCE_UPDATES";

const STATUS_COLOR_REGEX = /case\s\w+\.\w+\.ONLINE:.+case\s\w+\.\w+\.IDLE:/;

const moduleFindFailed = (name: string): void => logger.error(`Module ${name} not found!`);
let presenceUpdate: (e: {
  type: typeof EVENT_NAME;
  updates: {
    clientStatus: ClientStatus;
    guildId: string;
    status: string;
    user: { id: string };
  }[];
}) => void;

export async function start(): Promise<void> {
  const cfg = await settings.init<PlatformIndicatorsSettings>("me.puyodead1.PlatformIndicators");

  // add any new settings
  for (const [key, value] of Object.entries(PlatformIndicatorsSettings)) {
    if (!cfg.has(key)) {
      logger.log(`Adding new setting ${key} with value`, value);
      cfg.set(key, value as any);
    }
  }

  const debug = cfg.get("debug", PlatformIndicatorsSettings.debug);

  debugLog(debug, "Waiting for SessionStore module");
  const SessionStore = await webpack.waitForModule<SessionStore>(
    webpack.filters.byProps("getActiveSession"),
    {
      timeout: 10000,
    },
  );
  if (!SessionStore) return moduleFindFailed("SessionStore");

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

  const usfsFnName = webpack.getFunctionKeyBySource(
    useStateFromStoreMod as any,
    "useStateFromStore",
  ) as string;
  if (!usfsFnName) return logger.error("Failed to get function name for useStateFromStoreMod");

  const useStateFromStore = useStateFromStoreMod[usfsFnName] as any;

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

  const PlatformIndicator = platformIndicator({
    useStateFromStore,
    SessionStore,
    PresenceStore,
    getStatusColor,
    profileBadge24: profileBadgeMod.profileBadge24,
  });

  inject.after(injectionModule, fnName, ([args], res, _) => {
    const user = args.message.author as User;
    if (args.decorations && args.decorations["1"] && args.message && user) {
      const a = (
        <ErrorBoundary>
          <PlatformIndicator user={user} />
        </ErrorBoundary>
      );
      args.decorations[1].push(a);
    }
    return res;
  });
}

export function stop(): void {
  inject.uninjectAll();
  fluxDispatcher.unsubscribe(EVENT_NAME, presenceUpdate as any);
  logger.log("Unsubscribed from Presence updates");
}
