import { webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import { PresenceStore, SessionStore } from "./interfaces";
import { User } from "discord-types/general";
import { debugLog, functionNameFindFailed, moduleFindFailed } from "./utils";

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
    const useStatusFillColorMod = await webpack.waitForModule<Record<string, AnyFunction>>(
      webpack.filters.bySource(".Masks.STATUS_ONLINE_MOBILE"),
      {
        timeout: 10000,
      },
    );

    if (!useStatusFillColorMod) return moduleFindFailed("useStatusFillColorMod");

    modules.useStatusFillColor = webpack.getFunctionBySource<
      (status: string, desature?: boolean) => string
    >(useStatusFillColorMod, ")).hex")!;

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

    debugLog(debug, "Waiting for User Profile Context module");
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
    }>(webpack.filters.bySource(/{profileThemeStyle:\w+,profileThemeClassName:\w+}/), {
      timeout: 10000,
    });
    debugLog(debug, "Found User Profile Context module");

    return true;
  },
};
