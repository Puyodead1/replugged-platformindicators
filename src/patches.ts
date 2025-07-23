import { PlaintextPatch } from "replugged/types";

import ManifestJSON from "../manifest.json";

export default [
  {
    find: 'location:"private_channel"',
    replacements: [
      {
        match: /decorators:(\w+\.isSystemDM\(\).{50,100}?null)/,
        replace: (_, children: string) =>
          `decorators:[${children},replugged?.plugins?.getExports('${ManifestJSON.id}')?._renderPlatformIndicator(arguments[0].user)]`,
      },
    ],
  },
  {
    find: ".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)",
    replacements: [
      {
        match: /decorators:(\(0,\w+\.jsx\).+?}\))/,
        replace: (_, prefix: string) =>
          `decorators:[${prefix},replugged?.plugins?.getExports('${ManifestJSON.id}')?._renderPlatformIndicator(arguments[0].user)]`,
      },
    ],
  },
] as PlaintextPatch[];
