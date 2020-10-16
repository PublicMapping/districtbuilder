/** @jsx jsx */
import { jsx, Styled } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { style, invertStyles } from "./MenuButton.styles";

enum UserMenuKeys {
  Contact = "contact",
  Guide = "guide"
}

const guideLink =
  "https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder";

const contactLink = "mailto:support@districtbuilder.org";

interface SupportProps {
  readonly invert?: boolean;
}

const SupportMenu = (props: SupportProps) => {
  return (
    <Wrapper sx={{ position: "relative", pr: 1 }}>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="support-menu"
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
