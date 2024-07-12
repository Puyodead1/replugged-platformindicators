import { User } from "discord-types/general";
import Replugged, { common } from "replugged";
import { Platforms, PresenceStore, SessionStore } from "../interfaces";
import { logger } from "../utils";
import iconMaker from "./Icon";
const { React, fluxHooks } = common;

let currentUser: User | null = null;

interface Props {
  useStateFromStore: typeof fluxHooks.useStateFromStores;
  SessionStore: SessionStore;
  PresenceStore: PresenceStore;
  useStatusFillColor: (status: string, desaturate?: boolean) => string;
  profileBadge24: string;
  user: User;
}

interface PropsWithUser extends Props {
  currentUser: User;
}

const Icons = {
  desktop: iconMaker(
    "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z",
  ),
  web: iconMaker(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z",
  ),
  mobile: iconMaker(
    "M15.5 1h-8A2.5 2.5 0 0 0 5 3.5v17A2.5 2.5 0 0 0 7.5 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z",
  ),
  embedded: iconMaker(
    "M17 2H7C4.8 2 3 3.8 3 6V18C3 20.2 4.8 22 7 22H17C19.2 22 21 20.2 21 18V6C21 3.8 19.2 2 17 2ZM10.86 18.14C10.71 18.29 10.52 18.36 10.33 18.36C10.14 18.36 9.95 18.29 9.8 18.14L9.15 17.49L8.53 18.11C8.38 18.26 8.19 18.33 8 18.33C7.81 18.33 7.62 18.26 7.47 18.11C7.18 17.82 7.18 17.34 7.47 17.05L8.09 16.43L7.5 15.84C7.21 15.55 7.21 15.07 7.5 14.78C7.79 14.49 8.27 14.49 8.56 14.78L9.15 15.37L9.77 14.75C10.06 14.46 10.54 14.46 10.83 14.75C11.12 15.04 11.12 15.52 10.83 15.81L10.21 16.43L10.86 17.08C11.15 17.37 11.15 17.85 10.86 18.14ZM14.49 18.49C13.94 18.49 13.49 18.05 13.49 17.5V17.48C13.49 16.93 13.94 16.48 14.49 16.48C15.04 16.48 15.49 16.93 15.49 17.48C15.49 18.03 15.04 18.49 14.49 18.49ZM16.51 16.33C15.96 16.33 15.5 15.88 15.5 15.33C15.5 14.78 15.94 14.33 16.49 14.33H16.51C17.06 14.33 17.51 14.78 17.51 15.33C17.51 15.88 17.06 16.33 16.51 16.33ZM18 9.25C18 10.21 17.21 11 16.25 11H7.75C6.79 11 6 10.21 6 9.25V6.75C6 5.79 6.79 5 7.75 5H16.25C17.21 5 18 5.79 18 6.75V9.25Z",
  ),
};

function TheRealPlatformIndicator(props: PropsWithUser): React.ReactElement | null {
  const {
    user,
    currentUser,
    SessionStore,
    PresenceStore,
    useStateFromStore,
    profileBadge24,
    useStatusFillColor,
  } = props;

  const [icons, setIcons] = React.useState<any[]>([]);
  const statuses = useStateFromStore(
    [PresenceStore],
    () => PresenceStore.getState().clientStatuses[user.id],
    [user.id],
  );

  React.useEffect(() => {
    if (!statuses) {
      PresenceStore.getStatus(user.id);
    }
    const icons = (Object.entries(statuses ?? {}) as Array<[string, string]>).map(
      ([platform, status]) =>
        () => {
          const tooltip = `${
            platform[0].toUpperCase() +
            platform.slice(1) +
            (platform.toLowerCase() === "embedded" ? " (Console)" : "")
          } - ${status[0].toUpperCase() + status.slice(1)}`;
          const color = useStatusFillColor(status);
          const Icon = Icons[platform as Platforms] ?? Icons.desktop;
          return <Icon color={`${color}`} tooltip={tooltip} className={profileBadge24} />;
        },
    );
    setIcons(icons);
  }, [JSON.stringify(statuses)]);

  if (user.id === currentUser.id) {
    const sessions = SessionStore.getSessions();
    if (typeof sessions !== "object") {
      logger.warn("sessions is not an object");
      return null;
    }
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
    clientStatuses[currentUser.id as Platforms] = ownStatus as string;
  }

  if (!icons.length) return null;
  return (
    <div className="platform-indicators">
      {icons.map((Icon) => (
        <Icon />
      ))}
    </div>
  );
}

const MemorizedTheRealPlatformIndicator = React.memo(
  TheRealPlatformIndicator,
) as React.FC<PropsWithUser>;

function PlatformIndicator({ user, ...props }: Props): React.ReactElement<any, any> | null {
  if (!user || user.bot) return null;
  currentUser ??= Replugged.common.users.getCurrentUser();

  if (!currentUser) {
    logger.warn("Failed to get current user!");
    return null;
  }

  return <MemorizedTheRealPlatformIndicator {...props} user={user} currentUser={currentUser} />;
}

export default PlatformIndicator;
