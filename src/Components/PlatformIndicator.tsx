import { User } from "discord-types/general";
import Replugged, { common } from "replugged";
import { Platforms, PresenceStore, SessionStore, useStateFromStore } from "../interfaces";
import { logger } from "../utils";
import iconMaker from "./Icon";
const { React } = common;

let currentUser: User | null = null;

interface Props {
  useStateFromStore: useStateFromStore;
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
  console: iconMaker(
    "M14.8 2.7 9 3.1V47h3.3c1.7 0 6.2.3 10 .7l6.7.6V2l-4.2.2c-2.4.1-6.9.3-10 .5zm1.8 6.4c1 1.7-1.3 3.6-2.7 2.2C12.7 10.1 13.5 8 15 8c.5 0 1.2.5 1.6 1.1zM16 33c0 6-.4 10-1 10s-1-4-1-10 .4-10 1-10 1 4 1 10zm15-8v23.3l3.8-.7c2-.3 4.7-.6 6-.6H43V3h-2.2c-1.3 0-4-.3-6-.6L31 1.7V25z",
    "0 0 50 50",
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
    const icons = Object.entries(statuses ?? {}).map(([platform, status]) => () => {
      const tooltip = `${platform[0].toUpperCase() + platform.slice(1)} - ${
        status[0].toUpperCase() + status.slice(1)
      }`;
      const color = useStatusFillColor(status);
      const Icon = Icons[platform as Platforms] ?? Icons.desktop;
      return <Icon color={`${color}`} tooltip={tooltip} className={profileBadge24} />;
    });
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

function PlatformIndicator({ user, ...props }: Props) {
  if (!user || user.bot) return null;
  currentUser ??= Replugged.common.users.getCurrentUser();

  if (!currentUser) {
    logger.warn("Failed to get current user!");
    return null;
  }

  return <MemorizedTheRealPlatformIndicator {...props} user={user} currentUser={currentUser} />;
}

export default PlatformIndicator;
