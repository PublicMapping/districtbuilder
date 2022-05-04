/** @jsx jsx */
import { jsx, ThemeUIStyleObject } from "theme-ui";
import icons from "../icons";

interface IconProps {
  readonly name: keyof typeof icons;
  readonly color?: string;
  readonly size?: number;
  readonly className?: string;
  readonly sx?: ThemeUIStyleObject;
}

const Icon = ({ name, color, size, className }: IconProps) => {
  const { path, viewBox } = icons[name];
  const iconSize = size ? size : 1;
  return (
    <svg
      className={className}
      sx={{ height: `${iconSize}em`, width: `${iconSize}em` }}
      viewBox={viewBox}
    >
      <path d={path} sx={{ fill: color ? color : "currentColor" }} />
    </svg>
  );
};

export default Icon;
