import { User } from "discord-types/general";
import { ReactElement } from "react";
import { plugins, webpack } from "replugged";
import { toast } from "replugged/common";
import { ErrorBoundary } from "replugged/components";
import PlatformIndicatorComponent from "./Components/PlatformIndicator";
import { modules } from "./Modules";
import { PlatformIndicatorsSettings } from "./interfaces";
import "./style.css";
import { addNewSettings, cfg, inject, resetSettings } from "./utils";

import ManifestJSON from "../manifest.json";

export async function start(): Promise<void> {
  if (cfg.get("resetSettings", PlatformIndicatorsSettings.resetSettings)) resetSettings();

  addNewSettings();

  const debug = cfg.get("debug", PlatformIndicatorsSettings.debug);

  const initiated = await modules.init(debug);
  if (!initiated) return;

  patchMessageHeader();
  patchProfile();
}

function patchMessageHeader(): void {
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
      const icon = <PlatformIndicatorComponent user={user} />;
      if (icon === null) return args; // to prevent adding an empty div
      const a = <ErrorBoundary>{icon}</ErrorBoundary>;
      args[0].decorations[1].push(a);
    }
    return args;
  });
}

function patchProfile(): void {
  if (!modules.userProfileContextModule) {
    toast.toast("Unable to patch User Profile!", toast.Kind.FAILURE, {
      duration: 5000,
    });
    return;
  }

  inject.before(modules.userProfileContextModule, "render", (args) => {
    if (!cfg.get("renderInProfile")) return args;
    const [props] = args;
    if (!props?.children) return args;
    if (!Array.isArray(props?.children)) props.children = [props?.children];
    const profileHeaderIndex = props?.children?.findIndex?.((c: ReactElement) =>
      /{profileType:\w+,children:\w+}=/.exec(c?.type?.toString()),
    );
    if (profileHeaderIndex === -1) {
      const ProfileHeader = webpack.getBySource<
        React.ComponentType<{ profileType: string; children?: React.ReactElement[] }>
      >(/{profileType:\w+,children:\w+}=/)!;
      props?.children.unshift(<ProfileHeader profileType={props.profileType} />);
    }
    if (!props.user) return args;
    const profileHeader = props?.children[profileHeaderIndex != -1 ? profileHeaderIndex : 0];

    if (!Array.isArray(profileHeader.props.children)) {
      profileHeader.props.children = [profileHeader.props.children];
    }
    const icon = <PlatformIndicatorComponent user={props.user} />;
    if (icon === null) return args; // to prevent adding an empty div
    const a = <ErrorBoundary>{icon}</ErrorBoundary>;
    profileHeader.props.children.unshift(a);
    profileHeader.props.children.unshift = (...args: unknown[]) => {
      const item = profileHeader.props.children.splice(0, 1);
      Array.prototype.unshift.apply(profileHeader.props.children, args);
      Array.prototype.unshift.apply(profileHeader.props.children, item);
      return profileHeader.props.children.length;
    };
    return args;
  });
}

export function stop(): void {
  inject.uninjectAll();
}

export { Settings } from "./Components/Settings";

export const _renderPlatformIndicator = (user: User): ReactElement | null =>
  !plugins.getDisabled().includes(ManifestJSON.id) && user ? (
    <ErrorBoundary>
      <PlatformIndicatorComponent user={user} />
    </ErrorBoundary>
  ) : null;
