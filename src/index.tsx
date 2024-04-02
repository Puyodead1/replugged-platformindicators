import { User } from "discord-types/general";
import { ReactElement } from "react";
import { common, components, util } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import PlatformIndicatorComponent from "./Components/PlatformIndicator";
import { modules } from "./Modules";
import {
  ClientStatus,
  PlatformIndicatorsSettings,
  PresenceStore,
  SessionStore,
  useStateFromStore,
} from "./interfaces";
import "./style.css";
import { addNewSettings, cfg, forceRerenderElement, inject, logger, resetSettings } from "./utils";

const { fluxDispatcher, toast } = common;
const { ErrorBoundary } = components;

const EVENT_NAME = "PRESENCE_UPDATES";

let presenceUpdate: (e: {
  type: typeof EVENT_NAME;
  updates: Array<{
    clientStatus: ClientStatus;
    guildId: string;
    status: string;
    user: { id: string };
  }>;
}) => void;

export async function start(): Promise<void> {
  if (cfg.get("resetSettings", PlatformIndicatorsSettings.resetSettings)) resetSettings();

  // add any new settings
  addNewSettings();

  const debug = cfg.get("debug", PlatformIndicatorsSettings.debug);

  const res = await modules.init(debug);
  if (!res) return;
  const PlatformIndicatorProps = {
    useStateFromStore: modules.useStateFromStore!,
    SessionStore: modules.SessionStore!,
    PresenceStore: modules.PresenceStore!,
    useStatusFillColor: modules.useStatusFillColor!,
    profileBadge24: modules.profileBadgeMod!.profileBadge24,
  };
  patchMessageHeader(PlatformIndicatorProps);
  patchProfile(PlatformIndicatorProps);
  patchMemberList(PlatformIndicatorProps);
  patchDMList(PlatformIndicatorProps);
  rerenderRequired();
}

function patchMessageHeader(PlatformIndicatorProps: {
  useStateFromStore: useStateFromStore;
  SessionStore: SessionStore;
  PresenceStore: PresenceStore;
  useStatusFillColor: (status: string, desaturate?: boolean) => string;
  profileBadge24: string;
}): void {
  if (!modules.messageHeaderModule || !modules.messageHeaderFnName) {
    toast.toast("Unable to patch Message Header!", toast.Kind.FAILURE, {
      duration: 5000,
    });
    return;
  }

  inject.before(modules.messageHeaderModule, modules.messageHeaderFnName, (args, _) => {
    if (!cfg.get("renderInChat")) return args;
    const user = args[0].message.author as User;
    if (args[0].decorations?.["1"] && args[0].message && user) {
      const icon = <PlatformIndicatorComponent user={user} {...PlatformIndicatorProps} />;
      if (icon === null) return args; // to prevent adding an empty div
      const a = <ErrorBoundary>{icon}</ErrorBoundary>;
      args[0].decorations[1].push(a);
    }
    return args;
  });
}

function patchProfile(PlatformIndicatorProps: {
  useStateFromStore: useStateFromStore;
  SessionStore: SessionStore;
  PresenceStore: PresenceStore;
  useStatusFillColor: (status: string, desaturate?: boolean) => string;
  profileBadge24: string;
}): void {
  if (!modules.userBadgeModule) {
    toast.toast("Unable to patch User Profile Badges!", toast.Kind.FAILURE, {
      duration: 5000,
    });
    return;
  }

  inject.after(modules.userBadgeModule, "default", ([args], res: ReactElement, _) => {
    if (!cfg.get("renderInProfile")) return res;
    const user = args.user as User;

    const theChildren = res?.props?.children;
    if (!theChildren || !user || !(theChildren instanceof Array)) return res;
    const icon = <PlatformIndicatorComponent user={user} {...PlatformIndicatorProps} />;
    if (icon === null) return res; // to prevent adding an empty div
    const a = <ErrorBoundary>{icon}</ErrorBoundary>;
    res.props.children = [a, ...theChildren];

    if (theChildren.length > 0) {
      if (!res.props.className.includes(modules.userBadgeClasses?.containerWithContent))
        res.props.className += ` ${modules.userBadgeClasses?.containerWithContent}`;

      if (!res.props.className.includes("platform-indicator-badge-container"))
        res.props.className += " platform-indicator-badge-container";
    }

    return res;
  });
}

function patchMemberList(PlatformIndicatorProps: {
  useStateFromStore: useStateFromStore;
  SessionStore: SessionStore;
  PresenceStore: PresenceStore;
  useStatusFillColor: (status: string, desaturate?: boolean) => string;
  profileBadge24: string;
}): void {
  if (!modules.memberListModule) {
    toast.toast("Unable to patch Member List!", toast.Kind.FAILURE, { duration: 5000 });
    return;
  }

  inject.after(
    modules.memberListModule!,
    modules.memberListFnName!,
    ([{ user }]: [{ user: User }], res: React.ReactElement, _) => {
      if (!cfg.get("renderInMemberList")) return res;
      if (!res?.props?.children && typeof res?.props?.children != "function") return;

      const children = res?.props?.children();

      if (Array.isArray(children.props?.decorators?.props?.children) && user) {
        const icon = <PlatformIndicatorComponent user={user} {...PlatformIndicatorProps} />;
        if (icon === null) return res; // to prevent adding an empty div
        const a = <ErrorBoundary>{icon}</ErrorBoundary>;
        children.props?.decorators?.props?.children.push(a);
      }

      res.props.children = () => {
        return children;
      };

      return res;
    },
  );
}

function patchDMList(PlatformIndicatorProps: {
  useStateFromStore: useStateFromStore;
  SessionStore: SessionStore;
  PresenceStore: PresenceStore;
  useStatusFillColor: (status: string, desaturate?: boolean) => string;
  profileBadge24: string;
}): void {
  if (!modules.dmListModule || !modules.dmListFnName) {
    toast.toast("Unable to patch DM List!", toast.Kind.FAILURE, { duration: 5000 });
    return;
  }
  inject.after(
    modules.dmListModule,
    modules.dmListFnName,
    (_args, res: { type: AnyFunction }, _) => {
      if (!modules.dmListModule![modules.dmListFnName!].prototype.patchedDMListItemType) {
        inject.after(
          res,
          "type",
          ([{ user }]: [{ user: User }], res: { props: { children: AnyFunction } }) => {
            if (!cfg.get("renderInDirectMessageList") || !user) return res;
            inject.after(res.props, "children", (_args, res: ReactElement, _) => {
              const { findInReactTree } = util as unknown as {
                findInReactTree: (
                  tree: ReactElement,
                  filter: AnyFunction,
                  maxRecursions?: number,
                ) => ReactElement;
              };
              const container = findInReactTree(
                res,
                (c) => c?.props?.avatar && c?.props?.name && c?.props?.subText,
              );
              if (!container) return res;
              const a = (
                <ErrorBoundary>
                  <PlatformIndicatorComponent user={user} {...PlatformIndicatorProps} />
                </ErrorBoundary>
              );
              if (Array.isArray(container.props.decorators)) {
                container?.props?.decorators.push(a);
              } else if (container.props.decorators === null) {
                container.props.decorators = [a];
              } else {
                container.props.decorators = [...Array.from(container.props.decorators), a];
              }
              return res;
            });
            return res;
          },
        );
        modules.dmListModule![modules.dmListFnName!].prototype.patchedDMListItemType = res.type;
      }
      res.type =
        modules.dmListModule![modules.dmListFnName!].prototype.patchedDMListItemType ?? res.type;
    },
  );
}

function rerenderRequired(): void {
  void util
    .waitFor("[class^=layout-]")
    .then(() => forceRerenderElement("[class^=privateChannels-]"));
  void util.waitFor("li [class*=message-] h3").then(() => forceRerenderElement("[class^=chat-]"));
}

export function stop(): void {
  inject.uninjectAll();
  delete modules.dmListModule![modules.dmListFnName!].prototype.patchedDMListItemType;
  fluxDispatcher.unsubscribe(EVENT_NAME, presenceUpdate as any);
  logger.log("Unsubscribed from Presence updates");
}

export { Settings } from "./Components/Settings";
