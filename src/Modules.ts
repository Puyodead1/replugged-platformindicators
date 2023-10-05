import { webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import { PresenceStore, SessionStore, useStateFromStore } from "./interfaces";
import {
  STATUS_COLOR_REGEX,
  debugLog,
  functionNameFindFailed,
  logger,
  moduleFindFailed,
} from "./utils";

export const modules: {
  SessionStore: SessionStore | null;
  PresenceStore: PresenceStore | null;
  messageHeaderModule: Record<string, AnyFunction> | null;
  messageHeaderFnName: string | null;
  getStatusColor: ((status: string) => string) | null;
  profileBadgeMod: Record<string, string> | null;
  useStateFromStore: useStateFromStore | null;
  userBadgeClasses: Record<string, string> | null;
  userBadgeModule: Record<string, AnyFunction> | null;
  userBadgeFnName: string | null;
  memberListModule: Record<string, AnyFunction> | null;
  memberListFnName: string | null;
  dmListModule: Record<string, AnyFunction> | null;
  dmListFnName: string | null;
  init: (debug: boolean) => Promise<boolean>;
} = {
  SessionStore: null,
  PresenceStore: null,
  messageHeaderModule: null,
  messageHeaderFnName: null,
  getStatusColor: null,
  profileBadgeMod: null,
  useStateFromStore: null,
  userBadgeClasses: null,
  userBadgeModule: null,
  userBadgeFnName: null,
  memberListModule: null,
  memberListFnName: null,
  dmListModule: null,
  dmListFnName: null,
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
    modules.PresenceStore = await webpack.waitForModule<PresenceStore>(
      webpack.filters.byProps("setCurrentUserOnConnectionOpen"),
      {
        timeout: 10000,
      },
    );
    if (!modules.PresenceStore) return moduleFindFailed("PresenceStore");

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
    modules.getStatusColor = getStatusColor;

    debugLog(debug, "Waiting for profile badge classes module");
    modules.profileBadgeMod = await webpack.waitForModule<Record<string, string>>(
      webpack.filters.byProps("profileBadge24"),
      {
        timeout: 10000,
      },
    );
    if (!modules.profileBadgeMod) return moduleFindFailed("profileBadgeMod");

    debugLog(debug, "Waiting for userStateFromStore module");
    // const useStateFromStoreMod = await webpack.waitForModule<ObjectExports>(
    //   webpack.filters.bySource("useStateFromStores"),
    //   {
    //     timeout: 10000,
    //   },
    // );
    // if (!useStateFromStoreMod) return moduleFindFailed("useStateFromStoreMod");
    const useStateFromStoreMod = webpack
      .getBySource("useStateFromStores", { all: true })
      .find((x) => webpack.getFunctionKeyBySource(x, "useStateFromStores"));
    if (!useStateFromStoreMod) return moduleFindFailed("useStateFromStoreMod");

    const usfsFnName = webpack.getFunctionKeyBySource(useStateFromStoreMod, "useStateFromStores")!;
    if (!usfsFnName) return functionNameFindFailed("useStateFromStoreMod");
    modules.useStateFromStore = useStateFromStoreMod[usfsFnName] as useStateFromStore;
    debugLog(debug, "Found useStateFromStore module");

    debugLog(debug, "Waiting for Message Header module");
    modules.messageHeaderModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.bySource(/\w+.withMentionPrefix,\w+=void\s0!==\w/), {
      timeout: 10000,
    });
    if (!modules.messageHeaderModule) return moduleFindFailed("messageHeaderModule");

    const messageHeaderFnName = Object.entries(modules.messageHeaderModule).find(([_, v]) =>
      v.toString()?.match(/.withMentionPrefix/),
    )?.[0];

    if (!messageHeaderFnName) return functionNameFindFailed("messageHeaderModule");
    modules.messageHeaderFnName = messageHeaderFnName;
    debugLog(debug, "Found Message Header module");

    debugLog(debug, "Waiting for user badge classes");
    modules.userBadgeClasses = await webpack.waitForProps<Record<string, string>>(
      "containerWithContent",
    );
    debugLog(debug, "Found User Badge classes");

    debugLog(debug, "Waiting for user badge module");
    modules.userBadgeModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.bySource("getBadges()"), {
      timeout: 10000,
    });

    const userBadgeFnName = Object.entries(modules.userBadgeModule).find(
      ([_, v]) => typeof v === "function",
    )?.[0];
    if (!userBadgeFnName) return functionNameFindFailed("userBadgeMod");
    modules.userBadgeFnName = userBadgeFnName;
    debugLog(debug, "Found UserBadge module");

    try {
      debugLog(debug, "Waiting for Member List module");
      modules.memberListModule = await webpack.waitForModule<Record<string, AnyFunction>>(
        webpack.filters.bySource("().memberInner"),
        {
          timeout: 10000,
        },
      );
      debugLog(debug, "Found Member List module");

      const memberListFnName = Object.entries(modules.memberListModule!).find(([_, v]) =>
        v.toString()?.includes(".isTyping"),
      )?.[0];
      if (!memberListFnName) return functionNameFindFailed("memberListModule");
      modules.memberListFnName = memberListFnName;
    } catch (e) {
      logger.error(e);
    }

    debugLog(debug, "Waiting for DM List module");
    modules.dmListModule = await webpack.waitForModule<Record<string, AnyFunction>>(
      webpack.filters.bySource(".interactiveSystemDM"),
      {
        timeout: 10000,
      },
    );
    if (!modules.dmListModule) return moduleFindFailed("dmListModule");

    const dmListFnName = Object.entries(modules.dmListModule).find(([_, v]) =>
      v.toString()?.includes(".getAnyStreamForUser("),
    )?.[0];
    if (!dmListFnName) return functionNameFindFailed("dmListModule");
    modules.dmListFnName = dmListFnName;
    debugLog(debug, "Found DM List module");

    return true;
  },
};
