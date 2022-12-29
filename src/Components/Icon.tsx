function Icon(
  Tooltip: React.FC<{
    text: string;
    children: (props: React.HTMLAttributes<HTMLSpanElement>) => JSX.Element;
  }>,
) {
  return (path: string, viewBox = "0 0 24 24") => {
    console.log(Tooltip, path, viewBox);
    return ({ color, tooltip }: { color: string; tooltip: string }) => {
      console.log(color, tooltip);
      return (
        <Tooltip text={tooltip}>
          {(props: React.HTMLAttributes<HTMLSpanElement>) => {
            console.log("props", props);
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
    };
  };
}
export default Icon;
