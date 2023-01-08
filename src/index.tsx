/* eslint-disable */
import { Stores } from "discord-types";
import { UserStore } from "discord-types/stores";
import EventEmitter from "events";
import { common, Injector, webpack } from "replugged";
import { AnyFunction, RawModule } from "replugged/dist/types";
import platformIndicator from "./Components/PlatformIndicator";
import { ClientStatus, PresenceStore, SessionStore } from "./interfaces";
import "./style.css";
import { logger } from "./utils";

const inject = new Injector();
const { fluxDispatcher } = common;
const TOOLTIP_REGEX = /shouldShowTooltip:!1/;
const EVENT_NAME = "PRESENCE_UPDATES";

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

export async function start(): Promise<void> {
  const SessionStore = await webpack.waitForModule<SessionStore>(
    webpack.filters.byProps("getActiveSession"),
  );
  if (!SessionStore) return moduleFindFailed("SessionStore");

  const PresenceStore = await webpack.waitForModule<PresenceStore>(
    webpack.filters.byProps("setCurrentUserOnConnectionOpen"),
  );
  if (!PresenceStore) return moduleFindFailed("PresenceStore");

  const UserStore = (await webpack.waitForModule<UserStore & RawModule>(
    webpack.filters.byProps("getCurrentUser", "initialize"),
  )) as Stores.UserStore | null;
  if (!UserStore) return moduleFindFailed("UserStore");

  const tooltipMod = await webpack.waitForModule<Record<string, React.FC>>(
    webpack.filters.bySource(TOOLTIP_REGEX),
  );
  const Tooltip = tooltipMod && webpack.getFunctionBySource<React.FC>(TOOLTIP_REGEX, tooltipMod);
  if (!Tooltip) return moduleFindFailed("Tooltip");

  const getStatusColorMod = await webpack.waitForModule<{
    [key: string]: string;
  }>(webpack.filters.bySource(/\w+.STATUS_GREEN_600;case/));
  if (!getStatusColorMod) return moduleFindFailed("getStatusColorMod");
  const getStatusColor = webpack.getFunctionBySource<(status: string) => string>(
    /\w+.STATUS_GREEN_600;case/,
    getStatusColorMod,
  );
  if (!getStatusColor) return moduleFindFailed("getStatusColor");

  const PlatformIndicator = platformIndicator(
    SessionStore,
    PresenceStore,
    UserStore,
    getStatusColor,
  );

  const injectionModule = await webpack.waitForModule<{
    [key: string]: AnyFunction;
  }>(webpack.filters.bySource(/\w+.withMentionPrefix,\w+=void\s0!==\w/));
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

  inject.after(injectionModule, fnName, ([args], res, fn) => {
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
