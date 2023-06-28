import { User } from "discord-types/general";
import { ReactElement } from "react";
import { common, components, util } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import platformIndicator from "./Components/PlatformIndicator";
import { modules } from "./Modules";
import { ClientStatus, PlatformIndicatorsSettings } from "./interfaces";
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

  const PlatformIndicator = platformIndicator({
    useStateFromStore: modules.useStateFromStore!,
    SessionStore: modules.SessionStore!,
    PresenceStore: modules.PresenceStore!,
    getStatusColor: modules.getStatusColor!,
    profileBadge24: modules.profileBadgeMod!.profileBadge24,
  });

  patchMessageHeader(PlatformIndicator);
  patchProfile(PlatformIndicator);
  patchMemberList(PlatformIndicator);
  patchDMList(PlatformIndicator);

  await util.waitFor("[class^=layout-]");
  forceRerenderElement("[class^=privateChannels-]");
}

function patchMessageHeader(
  PlatformIndicator: ({ user }: { user: User }) => JSX.Element | null,
): void {
  if (!modules.messageHeaderModule || !modules.messageHeaderFnName) {
    toast.toast("Unable to patch Message Header!", toast.Kind.FAILURE, {
      duration: 5000,
    });
    return;
  }

  inject.before(modules.messageHeaderModule, modules.messageHeaderFnName, (args, _) => {
    if (!cfg.get("renderInChat")) return args;
    const user = args[0].message.author as User;
    if (args[0].decorations && args[0].decorations["1"] && args[0].message && user) {
      const a = (
        <ErrorBoundary>
          <PlatformIndicator user={user} />
        </ErrorBoundary>
      );
      args[0].decorations[1].push(a);
    }
    return args;
  });
}

function patchProfile(PlatformIndicator: ({ user }: { user: User }) => JSX.Element | null): void {
  if (!modules.userBadgeModule || !modules.userBadgeFnName) {
    toast.toast("Unable to patch User Profile Badges!", toast.Kind.FAILURE, {
      duration: 5000,
    });
    return;
  }

  inject.after(modules.userBadgeModule, modules.userBadgeFnName, ([args], res: ReactElement, _) => {
    if (!cfg.get("renderInProfile")) return res;
    const user = args.user as User;

    const theChildren = res?.props?.children;
    if (!theChildren || !user) return res;
    const a = (
      <ErrorBoundary>
        <PlatformIndicator user={user} />
      </ErrorBoundary>
    );
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

function patchMemberList(
  PlatformIndicator: ({ user }: { user: User }) => JSX.Element | null,
): void {
  if (!modules.memberListMemo) {
    toast.toast("Unable to patch Member List!", toast.Kind.FAILURE, { duration: 5000 });
    return;
  }

  const unpatchMemo = inject.after(
    modules.memberListMemo,
    "type",
    (_args, res: { type: AnyFunction }, _) => {
      inject.after(
        res.type.prototype,
        "renderDecorators",
        (args, res, instance: { props?: { user: User } }) => {
          if (!cfg.get("renderInMemberList")) return res;

          const user = instance?.props?.user;
          if (Array.isArray(res?.props?.children) && user) {
            const a = (
              <ErrorBoundary>
                <PlatformIndicator user={user} />
              </ErrorBoundary>
            );
            res.props.children.push(a);
          }
          return res;
        },
      );

      unpatchMemo();
    },
  );
}

function patchDMList(PlatformIndicator: ({ user }: { user: User }) => JSX.Element | null): void {
  if (!modules.dmListModule || !modules.dmListFnName) {
    toast.toast("Unable to patch DM List!", toast.Kind.FAILURE, { duration: 5000 });
    return;
  }

  const unpatchConstructor = inject.after(
    modules.dmListModule,
    modules.dmListFnName,
    (_args, res: { type: AnyFunction }, _) => {
      inject.after(
        res.type.prototype,
        "render",
        (
          _args,
          res: { props: { children: AnyFunction } },
          instance: { props?: { user: User } },
        ) => {
          const user = instance?.props?.user;
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
                <PlatformIndicator user={user} />
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
      unpatchConstructor();
    },
  );
}

export function stop(): void {
  inject.uninjectAll();
  fluxDispatcher.unsubscribe(EVENT_NAME, presenceUpdate as any);
  logger.log("Unsubscribed from Presence updates");
}

export { Settings } from "./Components/Settings";
