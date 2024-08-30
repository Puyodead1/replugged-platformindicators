import { components } from "replugged";
const { Tooltip } = components;

function Icon(path: string, viewBox = "0 0 24 24") {
  return ({
    color,
    tooltip,
    className,
  }: {
    color: string;
    tooltip: string;
    className?: string;
  }) => (
    <Tooltip text={tooltip}>
      <svg
        className={className}
        viewBox={viewBox}
        fill={color}
        style={{
          width: 20,
          height: 20,
        }}>
        <path d={path} />
      </svg>
    </Tooltip>
  );
}
export default Icon;
