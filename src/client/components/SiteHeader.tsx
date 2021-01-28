/** @jsx jsx */
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Avatar from "react-avatar";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import * as H from "history";
import Icon from "../components/Icon";
import SupportMenu from "../components/SupportMenu";
import { Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { resetState } from "../actions/root";
import { clearJWT, getJWT } from "../jwt";
import { UserState } from "../reducers/user";
import store from "../store";

interface Props {
  readonly user: UserState;
}

enum UserMenuKeys {
  Logout = "logout"
}

const logout = () => {
  clearJWT();
  store.dispatch(resetState());
};

const style: ThemeUIStyleObject = {
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    py: 3,
    px: 3,
    bg: "gray.0",
    borderBottom: "1px solid",
    borderColor: "gray.1",
    boxShadow: "small"
  },
  logoLink: {
    borderRadius: "small",
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
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
    width: "150px",
    position: "absolute",
    mt: 2,
    right: 2,
    bg: "muted",
    py: 1,
    px: 1,
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
    "&:hover:not([disabled])": {
      bg: "gray.0",
      cursor: "pointer"
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
  }
};

const SiteHeader = ({ user }: Props) => {
  const history = useHistory();
  const isLoggedIn = getJWT() !== null;

  return (
    <Flex as="header" sx={style.header}>
      <Heading as="h1" sx={{ mb: "0px", mr: "auto", p: 2 }}>
        <Link to="/" sx={style.logoLink}>
          <Logo sx={{ width: "15rem" }} />
        </Link>
      </Heading>
      {!isLoggedIn ? (
        <React.Fragment>
          <Link to="/login" sx={{ p: 2 }}>
            Login
          </Link>{" "}
          <Link to="/register" sx={{ p: 2 }}>
            Register
          </Link>
        </React.Fragment>
      ) : "resource" in user ? (
        <React.Fragment>
          <SupportMenu />
          <Wrapper onSelection={handleSelection(history)} sx={{ ml: 3 }}>
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
        </React.Fragment>
      ) : null}
    </Flex>
  );
};

const handleSelection = (history: H.History) => (key: string | number) => {
  // eslint-disable-next-line
  if (key === UserMenuKeys.Logout) {
    logout();
    history.push("/login");
  }
};

export default SiteHeader;
