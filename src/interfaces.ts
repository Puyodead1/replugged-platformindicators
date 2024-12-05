/* eslint-disable */

import { AnyFunction, RawModule } from "replugged/dist/types";
import { Store } from "replugged/dist/renderer/modules/common/flux";
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Platforms = "desktop" | "mobile" | "web" | "embedded";

export interface SessionStore extends Store {
  getActiveSession: () => unknown;
  getRemoteActivities: () => unknown;
  getSession: () => unknown;
  getSessionById: (id: unknown) => unknown;
  getSessions: () => { [key: string]: unknown };
}

export interface PresenceStore extends Store {
  findActivity: (e: unknown, t: unknown) => unknown;
  getActivities: (e: unknown) => unknown;
  getActivityMetadata: (e: unknown) => unknown;
  getAllApplicationActivities: (e: unknown) => unknown;
  getApplicationActivity: (e: unknown, t: unknown) => unknown;
  getPrimaryActivity: (e: unknown) => unknown;
  getState: () => {
    activities: unknown;
    activityMetadata: unknown;
    clientStatuses: { [key: string]: any };
    presencesForGuilds: unknown;
    statuses: { [key: string]: string };
  };
  getStatus: (e: unknown) => unknown;
  getUserIds: () => unknown;
  initialize: () => unknown;
  isMobileOnline: (e: unknown) => unknown;
  setCurrentUserOnConnectionOpen: (e: unknown, t: unknown) => unknown;
}

export type ClientStatus = RequireAtLeastOne<{
  desktop: string;
  mobile: string;
  web: string;
  embedded: string;
}>;

export interface PlatformIndicatorsSettings {
  debug: boolean;
  renderInChat: boolean;
  renderInProfile: boolean;
  renderInMemberList: boolean;
  renderInDirectMessageList: boolean;
  resetSettings: boolean;
  renderDesktop: boolean;
  renderWeb: boolean;
  renderMobile: boolean;
  renderEmbedded: boolean;
  desktopText: string;
  webText: string;
  mobileText: string;
  embeddedText: string;
  onlineText: string;
  dndText: string;
  idleText: string;
  invisibleText: string;
  streamingText: string;
  desktopTooltip: string;
  webTooltip: string;
  mobileTooltip: string;
  embeddedTooltip: string;
}

export const PlatformIndicatorsSettings: PlatformIndicatorsSettings = {
  debug: false,
  renderInChat: true,
  renderInProfile: true,
  renderInMemberList: true,
  renderInDirectMessageList: true,
  resetSettings: false,

  renderDesktop: true,
  renderWeb: true,
  renderMobile: true,
  renderEmbedded: true,

  desktopText: "",
  webText: "",
  mobileText: "",
  embeddedText: "",

  onlineText: "",
  dndText: "",
  idleText: "",
  invisibleText: "",
  streamingText: "",

  desktopTooltip: "",
  webTooltip: "",
  mobileTooltip: "",
  embeddedTooltip: "",
};
