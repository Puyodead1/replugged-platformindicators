import { webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import { PresenceStore, SessionStore, useStateFromStore } from "./interfaces";
import { debugLog, functionNameFindFailed, logger, moduleFindFailed } from "./utils";

export const modules: {
  SessionStore: SessionStore | null;
  PresenceStore: PresenceStore | null;
  messageHeaderModule: Record<string, AnyFunction> | null;
  messageHeaderFnName: string | null;
  useStatusFillColor: ((status: string, desature?: boolean) => string) | null;
  profileBadgeMod: Record<string, string> | null;
  useStateFromStore: useStateFromStore | null;
  userBadgeClasses: Record<string, string> | null;
  userBadgeModule: Record<string, AnyFunction> | null;
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
  useStatusFillColor: null,
  profileBadgeMod: null,
  useStateFromStore: null,
  userBadgeClasses: null,
  userBadgeModule: null,
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
    debugLog(debug, "Found SessionStore module");

    debugLog(debug, "Waiting for PresenceStore module");
    modules.PresenceStore = await webpack.waitForModule<PresenceStore>(
      webpack.filters.byProps("setCurrentUserOnConnectionOpen"),
      {
        timeout: 10000,
      },
    );
    if (!modules.PresenceStore) return moduleFindFailed("PresenceStore");
    debugLog(debug, "Found PresenceStore module");

    debugLog(debug, "Waiting for useStatusFillColor function");
    const useStatusFillColorMod = await webpack.waitForModule<
      Record<string, AnyFunction> | undefined
    >(webpack.filters.byProps("useStatusFillColor"), {
      timeout: 10000,
    });
    if (!useStatusFillColorMod) return moduleFindFailed("useStatusFillColorMod");
    // const useStatusFillColor = webpack.getFunctionBySource<(status: string) => string>(
    //   useStatusFillColorMod,
    //   STATUS_COLOR_REGEX,
    // );
    // if (!useStatusFillColor) return moduleFindFailed("useStatusFillColor");
    modules.useStatusFillColor = useStatusFillColorMod.useStatusFillColor as (
      status: string,
      desature?: boolean,
    ) => string;
    debugLog(debug, "Found useStatusFillColor function");
    debugLog(debug, "Waiting for profile badge classes module");
    const profileBadgeMod = await webpack.waitForModule<Record<string, string> | undefined>(
      webpack.filters.byProps("profileBadge24"),
      {
        timeout: 10000,
      },
    );
    if (!profileBadgeMod) return moduleFindFailed("profileBadgeMod");
    modules.profileBadgeMod = profileBadgeMod;
    debugLog(debug, "Found profile badge classes module");

    debugLog(debug, "Waiting for userStateFromStore module");
    const useStateFromStoreMod = await webpack.waitForModule<
      Record<string, AnyFunction> | undefined
    >(webpack.filters.byProps("useStateFromStores"), {
      timeout: 10000,
    });
    if (!useStateFromStoreMod) return moduleFindFailed("useStateFromStoreMod");

    modules.useStateFromStore = useStateFromStoreMod.useStateFromStores as useStateFromStore;
    debugLog(debug, "Found useStateFromStore module");

    debugLog(debug, "Waiting for Message Header module");
    modules.messageHeaderModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.byProps("UsernameDecorationTypes"), {
      timeout: 10000,
    });
    if (!modules.messageHeaderModule) return moduleFindFailed("messageHeaderModule");
    debugLog(debug, "Found Message Header module");

    const messageHeaderFnName = webpack.getFunctionKeyBySource(
      modules.messageHeaderModule,
      /withMentionPrefix/,
    );

    if (!messageHeaderFnName) return functionNameFindFailed("messageHeaderModule");
    modules.messageHeaderFnName = messageHeaderFnName;
    debugLog(debug, "Found Message Header function name");

    debugLog(debug, "Waiting for user badge classes");
    modules.userBadgeClasses = await webpack.waitForProps<Record<string, string>>(
      "containerWithContent",
    );
    debugLog(debug, "Found User Badge classes");

    debugLog(debug, "Waiting for user badge module");
    modules.userBadgeModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.byProps("BadgeSizes"), {
      timeout: 10000,
    });
    debugLog(debug, "Found UserBadge module");

    try {
      debugLog(debug, "Waiting for Member List module");
      modules.memberListModule = await webpack.waitForModule<Record<string, AnyFunction>>(
        webpack.filters.byProps("AVATAR_DECORATION_PADDING"),
        {
          timeout: 10000,
        },
      );
      debugLog(debug, "Found Member List module");

      const memberListFnName = webpack.getFunctionKeyBySource(modules.memberListModule, /isTyping/);
      if (!memberListFnName) return functionNameFindFailed("memberListModule");
      modules.memberListFnName = memberListFnName;
      debugLog(debug, "Found Member List function name");
    } catch (e) {
      logger.error(e);
    }

    debugLog(debug, "Waiting for DM List module");
    modules.dmListModule = await webpack.waitForModule<Record<string, AnyFunction>>(
      webpack.filters.byProps("LinkButton"),
      {
        timeout: 10000,
      },
    );
    if (!modules.dmListModule) return moduleFindFailed("dmListModule");
    debugLog(debug, "Found DM List module");

    const dmListFnName = webpack.getFunctionKeyBySource(
      modules.dmListModule,
      /getAnyStreamForUser/,
    );
    if (!dmListFnName) return functionNameFindFailed("dmListModule");
    modules.dmListFnName = dmListFnName;
    debugLog(debug, "Found DM List function name");

    return true;
  },
};
