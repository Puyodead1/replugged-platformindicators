/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable new-cap */
import { Components, Stores } from "discord-types";
import { User } from "discord-types/general";
import { Injector, webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import Icon from "./Components/Icon";

const inject = new Injector();

const moduleFindFailed = (name: string): void => console.error(`Module ${name} not found!`);

export async function start(): Promise<void> {
  const SessionStore = await webpack.waitForModule<{
    getActiveSession: () => unknown;
    getRemoteActivities: () => unknown;
    getSession: () => unknown;
    getSessionById: (id: unknown) => unknown;
    getSessions: () => { [key: string]: unknown };
  }>(webpack.filters.byProps("getActiveSession"));
  if (!SessionStore) return moduleFindFailed("SessionStore");

  const PresenceStore = await webpack.waitForModule<{
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
  }>(webpack.filters.byProps("setCurrentUserOnConnectionOpen"));
  if (!PresenceStore) return moduleFindFailed("PresenceStore");

  const UserStore = (await webpack.waitForModule<any>(
    webpack.filters.byProps("getCurrentUser", "initialize"),
  )) as Stores.UserStore | null;
  if (!UserStore) return moduleFindFailed("UserStore");

  const Tooltip = await webpack.waitForModule<Components.Tooltip>(
    webpack.filters.byProps("Positions", "Colors"),
  );
  if (!Tooltip) return moduleFindFailed("Tooltip");

  const getStatusColorMod = await webpack.waitForModule<{
    [key: string]: string;
  }>(webpack.filters.bySource(/\w+.STATUS_GREEN_600;case/));
  if (!getStatusColorMod) return moduleFindFailed("getStatusColorMod");
  const getStatusColor = webpack.getFunctionBySource<(status: string) => string>(
    /\w+.STATUS_GREEN_600;case/,
    getStatusColorMod,
  );
  if (!getStatusColor) return moduleFindFailed("getStatusColor");

  const Icons = {
    desktop: Icon(
      "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z",
    ),
    web: Icon(
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z",
    ),
    mobile: Icon(
      "M15.5 1h-8A2.5 2.5 0 0 0 5 3.5v17A2.5 2.5 0 0 0 7.5 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z",
    ),
    console: Icon(
      "M14.8 2.7 9 3.1V47h3.3c1.7 0 6.2.3 10 .7l6.7.6V2l-4.2.2c-2.4.1-6.9.3-10 .5zm1.8 6.4c1 1.7-1.3 3.6-2.7 2.2C12.7 10.1 13.5 8 15 8c.5 0 1.2.5 1.6 1.1zM16 33c0 6-.4 10-1 10s-1-4-1-10 .4-10 1-10 1 4 1 10zm15-8v23.3l3.8-.7c2-.3 4.7-.6 6-.6H43V3h-2.2c-1.3 0-4-.3-6-.6L31 1.7V25z",
      "0 0 50 50",
    ),
  };

  type Platform = keyof typeof Icons;

  const PlatformIcon = ({ platform, status }: { platform: Platform; status: string }) => {
    const tooltip = platform[0].toUpperCase() + platform.slice(1);
    const Icon = Icons[platform] ?? Icons.desktop;

    return <Icon color={`var(--${getStatusColor(status)}`} tooltip={tooltip} />;
  };

  const getStatus = (id: string): Record<Platform, string> =>
    PresenceStore.getState()?.clientStatuses?.[id];

  const PlatformIndicator = ({
    user,
    inline = false,
    marginLeft = "4px",
  }: {
    user: User;
    inline?: boolean;
    marginLeft?: string;
  }) => {
    if (!user || user.bot) return;

    if (user.id === UserStore.getCurrentUser().id) {
      const sessions = SessionStore.getSessions();
      if (typeof sessions !== "object") return null;
      const sortedSessions = Object.values(sessions).sort(
        ({ status: a }: any, { status: b }: any) => {
          if (a === b) return 0;
          if (a === "online") return 1;
          if (b === "online") return -1;
          if (a === "idle") return 1;
          if (b === "idle") return -1;
          return 0;
        },
      );

      const ownStatus = Object.values(sortedSessions).reduce((acc: any, curr: any) => {
        if (curr.clientInfo.client !== "unknown") acc[curr.clientInfo.client] = curr.status;
        return acc;
      }, {});

      const { clientStatuses } = PresenceStore.getState();
      clientStatuses[UserStore.getCurrentUser().id] = ownStatus;
    }

    const status = PresenceStore.getState()?.clientStatuses?.[user.id] as Record<Platform, string>;
    if (!status) return;

    const icons = Object.entries(status).map(([platform, status]) => (
      <PlatformIcon key={platform} platform={platform as Platform} status={status} />
    ));

    if (!icons.length) {
      console.error("icons is empty");
      return null;
    }

    return (
      <div
        className="platform-indicator"
        style={{
          marginLeft,
          display: inline ? "inline-flex" : "flex",
          alignItems: "center",
          // transform: inline ? "translateY(4px)" : undefined,
        }}>
        {icons}
      </div>
    );
  };

  const mod = await webpack.waitForModule<{
    [key: string]: AnyFunction;
  }>(webpack.filters.bySource(/\w+.withMentionPrefix,\w+=void\s0!==\w/));

  const fnName = Object.entries(mod).find(([_, v]) =>
    v.toString()?.match(/.withMentionPrefix/),
  )?.[0];
  if (!fnName) return console.error("failed to get function name");

  inject.after(mod, fnName, ([args], res, fn) => {
    if (args.decorations && args.decorations["1"] && args.message && args.message.author) {
      const indicator = PlatformIndicator({
        user: args.message.author,
        inline: true,
      });
      args.decorations["1"].push(indicator);
    }
    return res;
  });
}

export function stop(): void {
  inject.uninjectAll();
}
