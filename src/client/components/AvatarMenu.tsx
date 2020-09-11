/** @jsx jsx */
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Avatar from "react-avatar";
import Icon from "./Icon";
import { clearJWT, getJWT } from "../jwt";
import store from "../store";
import { jsx, ThemeUIStyleObject } from "theme-ui";
import { resetState } from "../actions/root";
import { Link } from "react-router-dom";
import { UserState } from "../reducers/user";
import * as H from "history";
import React from "react";

enum UserMenuKeys {
  Logout = "logout"
}

const style: ThemeUIStyleObject = {
  avatar: {
    fontFamily: "heading",
    cursor: "pointer",
    ".sb-avatar__text": {
      "&:hover": {
        backgroundColor: "#395c78 !important"
      },
      "&:active": {
        backgroundColor: "#2c485e !important"
      }
    }
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    bg: "transparent",
    p: 1,
    borderRadius: "small",
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
  menu: {
    width: "100px",
    position: "absolute",
    mt: 0,
    right: 2,
    py: 1,
    px: 1,
    color: "white",
    bg: "#395c78",
    border: "1px solid",
    borderColor: "gray.2",
    boxShadow: "small",
    borderRadius: "small"
  },
  menuList: {
    p: "0",
    m: "0",
    listStyleType: "none"
  },
  menuListItem: {
    borderRadius: "small",
    py: 1,
    px: 2,
    color: "white",
    "&:hover:not([disabled])": {
      bg: "#2c485e",
      cursor: "pointer"
    },
    "&[disabled]": {
      color: "#2c485e",
      cursor: "not-allowed"
    },
    "&:focus": {
      bg: "#2c485e",
      outline: "none",
      boxShadow: "focus"
    },
    "&:active": {
      bg: "#2c485e"
    }
  }
};

const logout = () => {
  clearJWT();
  store.dispatch(resetState());
};

const handleSelection = (history: H.History) => (key: string | number) => {
  // eslint-disable-next-line
  if (key === UserMenuKeys.Logout) {
    logout();
    history.push("/login");
  }
};

const AvatarMenu = ({
  user,
  history
}: {
  readonly user: UserState;
  readonly history: H.History;
}) => {
  return getJWT() === null ? (
    <React.Fragment>
      <Link to="/login" sx={{ p: 2 }}>
        Login
      </Link>{" "}
      <Link to="/register" sx={{ p: 2 }}>
        Register
      </Link>
    </React.Fragment>
  ) : "resource" in user ? (
    <Wrapper onSelection={handleSelection(history)}>
      <MenuButton sx={style.menuButton}>
        <Avatar
          name={user.resource.name}
          round={true}
          size={"2.5rem"}
          color={"#2c485e"}
          maxInitials={3}
          sx={style.avatar}
        />
        <div sx={{ ml: 2 }}>
          <Icon name="chevron-down" />
        </div>
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.Logout}>
            <MenuItem value={UserMenuKeys.Logout} sx={style.menuListItem}>
              Logout
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  ) : null;
};

export default AvatarMenu;
