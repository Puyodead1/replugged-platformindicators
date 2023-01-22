/* eslint-disable */

import { RawModule } from "replugged/dist/types";

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
  [key: string]: string | boolean | { [key: number]: string } | null;
  debug: boolean;
}

export const PlatformIndicatorsSettings: PlatformIndicatorsSettings = {
  debug: false,
};
