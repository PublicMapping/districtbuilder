/** @jsx jsx */
import { jsx } from "theme-ui";
import icons from "../icons";

interface IconProps {
  readonly name: keyof typeof icons;
  readonly color?: string;
  readonly size?: number;
}

const Icon = ({ name, color, size }: IconProps) => {
  const { path, viewBox } = icons[name];
  const iconSize = size ? size : 1;
  return (
    <svg sx={{ height: `${iconSize}em`, width: `${iconSize}em` }} viewBox={viewBox}>
      <path d={path} sx={{ fill: color ? color : "currentColor" }} />
    </svg>
  );
};

export default Icon;
