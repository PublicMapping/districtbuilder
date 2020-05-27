/** @jsx jsx */
import { jsx } from "theme-ui";
import icons from "../icons";

interface IconProps {
  readonly name: keyof typeof icons;
  readonly color?: string;
}

const Icon = ({ name, color }: IconProps) => {
  const { path, viewBox } = icons[name];
  return (
    <svg sx={{ height: "1em", width: "1em" }} viewBox={viewBox}>
      <path d={path} fill={color ? color : "currentColor"} />
    </svg>
  );
};

export default Icon;
