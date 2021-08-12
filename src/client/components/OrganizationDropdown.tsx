/** @jsx jsx */
import { jsx } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { invertStyles, style } from "./MenuButton.styles";
import { OrganizationNest } from "../../shared/entities";
import * as H from "history";
import { useHistory } from "react-router-dom";

interface Props {
  readonly organizations: readonly OrganizationNest[];
}

const OrganizationDropdown = ({ organizations }: Props) => {
  const history = useHistory();
  return (
    <Wrapper sx={{ position: "relative" }} onSelection={handleSelection(history)}>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles({ invert: true }),
          ...{ color: "heading" }
        }}
        className="organization-menu"
      >
        My Organizations
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          {organizations.map(o => (
            <li key={o.slug}>
              <MenuItem value={o.slug} sx={style.menuListItem}>
                {o.name}
              </MenuItem>
            </li>
          ))}
        </ul>
      </Menu>
    </Wrapper>
  );
};

const handleSelection = (history: H.History) => (slug: string) => {
  history.push(`/o/${slug}`);
};

export default OrganizationDropdown;
