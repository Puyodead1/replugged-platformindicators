function Icon(path: string, viewBox = "0 0 24 24") {
  return ({ color }: { color: string; tooltip: string }) => (
    <svg height="20" width="20" viewBox={viewBox} fill={color}>
      <path d={path} />
    </svg>
  );
}
export default Icon;
