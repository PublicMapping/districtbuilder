/** @jsx jsx */
import { ThemeUIStyleObject } from "theme-ui";

export interface ButtonStyleProps {
  readonly invert?: boolean;
}

export const styles = ({ invert }: ButtonStyleProps): ThemeUIStyleObject => ({
  ...(invert
    ? {
        color: "muted"
      }
    : {
        color: "gray.7",
        bg: "gray.1",
        "&:hover:not([disabled]):not(:active)": {
          bg: "gray.2"
        }
      })
});
