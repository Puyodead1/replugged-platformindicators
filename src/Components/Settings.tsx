import { util } from "replugged";
import { React } from "replugged/common";
import {
  SwitchItem,
  Button,
  Text,
  Category,
  TextInput,
  FormItem,
  SelectItem,
} from "replugged/components";
import { cfg, resetSettings } from "../utils";

const ManifestJSON = require("../../manifest.json");

function TooltipCustomizer({ type }: { type: string }): JSX.Element {
  switch (type) {
    case "platform":
      return (
        <>
          <FormItem title="Desktop Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Desktop" {...util.useSetting(cfg, "desktopText")} />
          </FormItem>
          <FormItem title="Web Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Web" {...util.useSetting(cfg, "webText")} />
          </FormItem>
          <FormItem title="Mobile Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Mobile" {...util.useSetting(cfg, "mobileText")} />
          </FormItem>
          <FormItem title="Embedded (console) Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Embedded (Console)" {...util.useSetting(cfg, "embeddedText")} />
          </FormItem>
        </>
      );
    case "status":
      return (
        <>
          <FormItem title="Online Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Online" {...util.useSetting(cfg, "onlineText")} />
          </FormItem>
          <FormItem title="DND Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Dnd" {...util.useSetting(cfg, "dndText")} />
          </FormItem>
          <FormItem title="Idle Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Idle" {...util.useSetting(cfg, "idleText")} />
          </FormItem>
          <FormItem title="Invisible Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Invisible" {...util.useSetting(cfg, "invisibleText")} />
          </FormItem>

          <FormItem title="Streaming Text" style={{ marginBottom: 20 }} divider={true}>
            <TextInput placeholder="Streaming" {...util.useSetting(cfg, "streamingText")} />
          </FormItem>
        </>
      );
    case "overall":
    default:
      return (
        <>
          <FormItem title="Desktop Tooltip" style={{ marginBottom: 20 }} divider={true}>
            <TextInput
              placeholder="%platform% - %status%"
              {...util.useSetting(cfg, "desktopTooltip")}
            />
          </FormItem>

          <FormItem title="Web Tooltip" style={{ marginBottom: 20 }} divider={true}>
            <TextInput
              placeholder="%platform% - %status%"
              {...util.useSetting(cfg, "webTooltip")}
            />
          </FormItem>

          <FormItem title="Mobile Tooltip" style={{ marginBottom: 20 }} divider={true}>
            <TextInput
              placeholder="%platform% - %status%"
              {...util.useSetting(cfg, "mobileTooltip")}
            />
          </FormItem>

          <FormItem title="Embedded (console) Tooltip" style={{ marginBottom: 20 }} divider={true}>
            <TextInput
              placeholder="%platform% - %status%"
              {...util.useSetting(cfg, "embeddedTooltip")}
            />
          </FormItem>
        </>
      );
  }
}

export function Settings(): JSX.Element {
  const [canReset, setCanReset] = React.useState(true);
  const [tooltipSection, setTooltipSection] = React.useState("overall");
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  return (
    <div>
      <Category title="Locations" note="Toogle render locations">
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
      </Category>

      <Category title="Icon" note="Toogle Platform Icons">
        <SwitchItem note="Toggle desktop icon" {...util.useSetting(cfg, "renderDesktop")}>
          Desktop
        </SwitchItem>

        <SwitchItem note="Toggle web icon" {...util.useSetting(cfg, "renderWeb")}>
          Web
        </SwitchItem>

        <SwitchItem note="Toggle mobile icon" {...util.useSetting(cfg, "renderMobile")}>
          Mobile
        </SwitchItem>

        <SwitchItem
          note="Toggle embedded (console) icon"
          {...util.useSetting(cfg, "renderEmbedded")}>
          Embedded
        </SwitchItem>
      </Category>

      <Category
        key={`${tooltipSection}-${tooltipOpen}`}
        open={tooltipOpen}
        onChange={() => setTooltipOpen((prev) => !prev)}
        title="Tooltip Text"
        note={
          tooltipSection === "overall"
            ? "%status% - Original Status, %platform% - Original Platform"
            : ""
        }>
        <SelectItem
          value={tooltipSection}
          options={[
            {
              label: "Overall",
              value: "overall",
            },
            {
              label: "Status",
              value: "status",
            },
            {
              label: "Platform",
              value: "platform",
            },
          ]}
          onChange={(v) => setTooltipSection(v)}>
          Text Type
        </SelectItem>
        <TooltipCustomizer type={tooltipSection} />
      </Category>

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
