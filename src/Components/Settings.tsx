import { common, components, util } from "replugged";
import { cfg } from "..";
import { resetSettings } from "../utils";
const { SwitchItem, SliderItem, Button, Text } = components;
const { React } = common;

const ManifestJSON = require("../../manifest.json");

export function Settings() {
  const [canReset, setCanReset] = React.useState(true);

  return (
    <div>
      <SwitchItem
        note="Toggle rendering in the Member List"
        {...util.useSetting(cfg, "renderInMemberList")}>
        Show in Member List
      </SwitchItem>

      <SwitchItem note="Toggle rendering in Chat" {...util.useSetting(cfg, "renderInChat")}>
        Show in Chat
      </SwitchItem>

      <SliderItem
        {...util.useSetting(cfg, "size", 20)}
        minValue={8}
        maxValue={32}
        markers={[8, 12, 16, 20, 24, 28, 32]}>
        Slider title
      </SliderItem>

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
