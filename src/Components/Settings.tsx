import { common, components, util } from "replugged";
import { cfg, resetSettings } from "../utils";
const { SwitchItem, Button, Text } = components;
const { React } = common;

const ManifestJSON = require("../../manifest.json");

export function Settings(): JSX.Element {
  const [canReset, setCanReset] = React.useState(true);

  return (
    <div>
      <SwitchItem
        note="Toggle rendering in the DM List"
        {...util.useSetting(cfg, "renderInDirectMessageList")}>
        Show in DM List
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering in the User Profile as badge"
        {...util.useSetting(cfg, "renderInProfile")}>
        Show in User Profile
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering in the Member List"
        {...util.useSetting(cfg, "renderInMemberList")}>
        Show in Member List
      </SwitchItem>

      <SwitchItem note="Toggle rendering in Chat" {...util.useSetting(cfg, "renderInChat")}>
        Show in Chat
      </SwitchItem>

      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <Button
            onClick={() => {
              resetSettings();
              setCanReset(false);
            }}
            style={{ margin: "0 5px" }}
            color={Button.Colors.RED}
            disabled={!canReset}>
            Reset Settings
          </Button>
        </div>
        <Text style={{ textAlign: "center" }}>
          {ManifestJSON.name} V{ManifestJSON.version}
        </Text>
      </div>
    </div>
  );
}
