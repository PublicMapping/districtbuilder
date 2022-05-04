/** @jsx jsx */
import { jsx, Themed } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { toggleKeyboardShortcutsModal } from "../actions/projectModals";

enum UserMenuKeys {
  Contact = "contact",
  Guide = "guide",
  Blog = "blog",
  KeyboardShortcuts = "keyboardShortcuts"
}

const guideLink =
  "https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder";

const contactLink = "mailto:support@districtbuilder.org";

const blogLink = "https://medium.com/districtbuilder";

const showKeyboardShortcuts = () => store.dispatch(toggleKeyboardShortcutsModal());

interface StateProps {
  readonly project?: boolean;
}
interface SupportProps {
  readonly invert?: boolean;
}

const SupportMenu = ({ project, ...props }: SupportProps & StateProps) => {
  return (
    <Wrapper sx={{ position: "relative", pr: 1 }}>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props)
        }}
        className="support-menu"
      >
        <Icon name="question-circle" />
        Resources
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.Guide}>
            <MenuItem value={UserMenuKeys.Guide}>
              <Themed.a href={guideLink} target="_blank" sx={style.menuListItem}>
                <Icon name="book-spells" sx={style.menuListIcon} />
                Getting Started Guide
              </Themed.a>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.Blog}>
            <MenuItem value={UserMenuKeys.Blog}>
              <Themed.a href={blogLink} target="_blank" sx={style.menuListItem}>
                <Icon name="book-spells" sx={style.menuListIcon} />
                Blog
              </Themed.a>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.Contact}>
            <MenuItem value={UserMenuKeys.Contact}>
              <Themed.a href={contactLink} target="_blank" sx={style.menuListItem}>
                <Icon name="envelope" sx={style.menuListIcon} />
                Contact us
              </Themed.a>
            </MenuItem>
          </li>
          {project && (
            <li key={UserMenuKeys.KeyboardShortcuts}>
              <MenuItem value={UserMenuKeys.KeyboardShortcuts}>
                <Themed.a target="_blank" sx={style.menuListItem} onClick={showKeyboardShortcuts}>
                  <Icon name="keyboard" sx={style.menuListIcon} />
                  Show keyboard shortcuts
                </Themed.a>
              </MenuItem>
            </li>
          )}
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default SupportMenu;
