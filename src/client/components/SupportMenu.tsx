/** @jsx jsx */
import { jsx, Styled, ThemeUIStyleObject } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { styles } from "./SupportMenu.styles";

enum UserMenuKeys {
  Contact = "contact",
  Guide = "guide"
}

const guideLink =
  "https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder";

const contactLink = "mailto:support@districtbuilder.org";

const style: ThemeUIStyleObject = {
  menuButton: {
    py: 1,
    px: 3
  },
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
    zIndex: 3
  },
  menuList: {
    p: "0",
    m: "0",
    listStyleType: "none"
  },
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
  }
};

const SupportMenu = (props: any) => {
  return (
    <Wrapper sx={{ position: "relative" }}>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...styles(props),
          ...props
        }}
      >
        <Icon name="question-circle" />
        Support
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.Guide}>
            <MenuItem value={UserMenuKeys.Guide}>
              <Styled.a href={guideLink} target="_blank" sx={style.menuListItem}>
                <Icon name="book-spells" sx={style.menuListIcon} />
                Getting Started Guide
              </Styled.a>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.Contact}>
            <MenuItem value={UserMenuKeys.Contact}>
              <Styled.a href={contactLink} target="_blank" sx={style.menuListItem}>
                <Icon name="envelope" sx={style.menuListIcon} />
                Contact us
              </Styled.a>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default SupportMenu;
