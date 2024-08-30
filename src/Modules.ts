import { webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import { PresenceStore, SessionStore } from "./interfaces";
import { User } from "discord-types/general";
import { debugLog, functionNameFindFailed, logger, moduleFindFailed } from "./utils";

export const modules: {
  SessionStore: SessionStore | null;
  PresenceStore: PresenceStore | null;
  messageHeaderModule: Record<string, AnyFunction> | null;
  messageHeaderFnName: string | null;
  useStatusFillColor: ((status: string, desature?: boolean) => string) | null;
  userProfileContextModule: Record<string, AnyFunction> | null;
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
  userProfileContextModule: null,
  memberListModule: null,
  memberListFnName: null,
  dmListModule: null,
  dmListFnName: null,
  init: async (debug) => {
    debugLog(debug, "Waiting for SessionStore module");
    modules.SessionStore = await webpack.waitForProps<SessionStore>(["getActiveSession"], {
      timeout: 10000,
    });
    if (!modules.SessionStore) return moduleFindFailed("SessionStore");
    debugLog(debug, "Found SessionStore module");

    debugLog(debug, "Waiting for PresenceStore module");
    modules.PresenceStore = await webpack.waitForProps<PresenceStore>(
      ["setCurrentUserOnConnectionOpen"],
      {
        timeout: 10000,
      },
    );
    if (!modules.PresenceStore) return moduleFindFailed("PresenceStore");
    debugLog(debug, "Found PresenceStore module");

    debugLog(debug, "Waiting for useStatusFillColor function");
    const useStatusFillColorMod = await webpack.waitForProps<Record<string, AnyFunction>>(
      ["useStatusFillColor"],
      {
        timeout: 10000,
      },
    );
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

    debugLog(debug, "Waiting for Message Header module");
    modules.messageHeaderModule = await webpack.waitForModule<{
      [key: string]: AnyFunction;
    }>(webpack.filters.bySource(".SYSTEM_TAG=0"), {
      timeout: 10000,
    });
    if (!modules.messageHeaderModule) return moduleFindFailed("messageHeaderModule");
    debugLog(debug, "Found Message Header module");

    const messageHeaderFnName = webpack.getFunctionKeyBySource(
      modules.messageHeaderModule,
      "withMentionPrefix",
    );

    if (!messageHeaderFnName) return functionNameFindFailed("messageHeaderModule");
    modules.messageHeaderFnName = messageHeaderFnName;
    debugLog(debug, "Found Message Header function name");

    debugLog(debug, "Waiting for user profile context module");
    modules.userProfileContextModule = await webpack.waitForModule<{
      [key: string]: (
        props: {
          children: React.ReactElement[];
          className: string;
          profileType: string;
          user: User;
        },
        ...args: unknown[]
      ) => React.ReactElement;
    }>(webpack.filters.bySource(".biteSizeOverlayBackground)"), {
      timeout: 10000,
    });
    debugLog(debug, "Found UserBadge module");

    try {
      debugLog(debug, "Waiting for Member List module");
      modules.memberListModule = await webpack.waitForModule<Record<string, AnyFunction>>(
        webpack.filters.bySource(".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)"),
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
      webpack.filters.bySource('location:"private_channel"'),
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
