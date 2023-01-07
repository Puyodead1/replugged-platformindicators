import { components } from "replugged";
const { Tooltip } = components;

function Icon(path: string, viewBox = "0 0 24 24") {
  return ({ color, tooltip }: { color: string; tooltip: string }) => (
    <Tooltip text={tooltip}>
      {(props: React.HTMLAttributes<HTMLSpanElement>) => {
        return (
          <span {...props}>
            <svg height="20" width="20" viewBox={viewBox} fill={color}>
              <path d={path} />
            </svg>
          </span>
        );
      }}
    </Tooltip>
  );
}
export default Icon;
