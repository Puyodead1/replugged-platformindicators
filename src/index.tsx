/* eslint-disable */
import EventEmitter from "events";
import { common, Injector, settings, webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import platformIndicator from "./Components/PlatformIndicator";
import {
  ClientStatus,
  PlatformIndicatorsSettings,
  PresenceStore,
  SessionStore,
} from "./interfaces";
import "./style.css";
import { logger } from "./utils";

const inject = new Injector();
const { fluxDispatcher } = common;
const EVENT_NAME = "PRESENCE_UPDATES";

const STATUS_COLOR_REGEX = /\w+.TWITCH/;

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

const eventEmitter = new EventEmitter();

const debugLog = (debug: boolean, msg: string, ...args: any[]): void => {
  if (debug) logger.log(`[DEBUG] ${msg}`, ...args);
};

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
  if (!getStatusColorMod) return moduleFindFailed("profileBadgeMod");

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

  presenceUpdate = ({ updates }) => {
    for (const u of updates) {
      eventEmitter.emit(u.user.id, u.clientStatus);
    }
  };

  fluxDispatcher.subscribe(EVENT_NAME, presenceUpdate as any);
  logger.log("Subscribed to Presence updates");

  const PlatformIndicator = platformIndicator(
    SessionStore,
    PresenceStore,
    getStatusColor,
    profileBadgeMod.profileBadge24,
  );

  inject.after(injectionModule, fnName, ([args], res, _) => {
    if (args.decorations && args.decorations["1"] && args.message && args.message.author) {
      const a = <PlatformIndicator emitter={eventEmitter} user={args.message.author} />;
      args.decorations["1"].push(a);
    }
    return res;
  });
}

export function stop(): void {
  inject.uninjectAll();
  fluxDispatcher.unsubscribe(EVENT_NAME, presenceUpdate as any);
  logger.log("Unsubscribed from Presence updates");
}
