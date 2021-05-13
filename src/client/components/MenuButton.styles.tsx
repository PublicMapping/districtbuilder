/** @jsx jsx */
import { ThemeUIStyleObject } from "theme-ui";

export interface ButtonStyleProps {
  readonly invert?: boolean;
}

export const style = {
  menuButton: {
    py: 1,
    px: 3
  } as ThemeUIStyleObject,
  menu: {
    width: "220px",
    position: "absolute",
    mt: 2,
    right: 0,
    bg: "muted",
    py: 1,
    px: 1,
    border: "1px solid",
    borderColor: "gray.2",
    boxShadow: "small",
    borderRadius: "small",
    zIndex: 201
  } as ThemeUIStyleObject,
  menuList: {
    p: "0",
    m: "0",
    listStyleType: "none",
    fontSize: "14px"
  } as ThemeUIStyleObject,
  menuListItem: {
    textDecoration: "none",
    borderRadius: "small",
    color: "gray.8",
    fontWeight: "medium",
    display: "flex",
    alignItems: "center",
    py: 1,
    px: 2,
    "> svg": {
      mr: 2,
      color: "gray.3"
    },
    "&:hover:not([disabled]):not(:active)": {
      bg: "gray.0",
      cursor: "pointer",
      textDecoration: "none"
    },
    "&:visited": {
      color: "gray.8",
      bg: "gray.0",
      cursor: "pointer",
      textDecoration: "none"
    },
    "&[disabled]": {
      color: "gray.3",
      cursor: "not-allowed"
    },
    "&:focus": {
      bg: "gray.0",
      outline: "none",
      boxShadow: "focus"
    },
    "&:active": {
      bg: "gray.1"
    }
  },
  menuListIcon: {
    mr: "2"
  } as ThemeUIStyleObject
};

export const invertStyles = ({ invert }: ButtonStyleProps): ThemeUIStyleObject => ({
  ...(invert
    ? {
        color: "muted"
      }
    : {
        color: "gray.7",
        bg: "transparent",
        "&:hover:not([disabled]):not(:active)": {
          bg: "gray.2"
        }
      })
});
