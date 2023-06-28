/* eslint-disable */

import { AnyFunction, RawModule } from "replugged/dist/types";

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Platforms = "desktop" | "mobile" | "web" | "console";

export interface SessionStore extends RawModule {
  getActiveSession: () => unknown;
  getRemoteActivities: () => unknown;
  getSession: () => unknown;
  getSessionById: (id: unknown) => unknown;
  getSessions: () => { [key: string]: unknown };
}

export interface PresenceStore extends RawModule {
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
  console: string;
}>;

export interface PlatformIndicatorsSettings {
  debug: boolean;
  renderInChat: boolean;
  renderInProfile: boolean;
  renderInMemberList: boolean;
  renderInDirectMessageList: boolean;
  resetSettings: boolean;
}

export const PlatformIndicatorsSettings: PlatformIndicatorsSettings = {
  debug: false,
  renderInChat: true,
  renderInProfile: true,
  renderInMemberList: true,
  renderInDirectMessageList: true,
  resetSettings: false,
};

export type useStateFromStore = (store: any[], cb: () => unknown, data: any[]) => PresenceStore;
export type MemberListModule = {
  [key: string]: MemberListItem;
};

export type MemberListItem = {
  $$typeof: symbol;
  compare: null;
  type: AnyFunction;
};
