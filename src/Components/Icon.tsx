import { components, util } from "replugged";
import { cfg } from "..";
const { Tooltip } = components;

function Icon(path: string, viewBox = "0 0 24 24") {
  return ({ color, tooltip, className }: { color: string; tooltip: string; className: string }) => {
    const size = util.useSetting(cfg, "size", 20);

    return (
      <Tooltip text={tooltip}>
        <svg
          className={className}
          viewBox={viewBox}
          fill={color}
          style={{
            width: size.value,
            height: size.value,
          }}>
          <path d={path} />
        </svg>
      </Tooltip>
    );
  };
}
export default Icon;
