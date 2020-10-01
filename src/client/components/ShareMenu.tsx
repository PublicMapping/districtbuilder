/** @jsx jsx */
import { Button, Input, Flex, jsx } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { useClipboard } from "use-clipboard-copy";

import Icon from "../components/Icon";
import { style as menuButtonStyles, invertStyles } from "./MenuButton.styles";
import Tooltip from "./Tooltip";

const style = {
  input: {
    border: "none",
    borderRight: "1px solid",
    borderRightColor: "gray.2",
    borderRadius: 0
  },
  inputWrapper: {
    borderRadius: "small",
    border: "2px solid",
    borderColor: "gray.2"
  }
};

enum ShareMenuKeys {
  Share = "Share"
}

interface SupportProps {
  readonly invert?: boolean;
}

const SupportMenu = (props: SupportProps) => {
  const clipboard = useClipboard({ copiedTimeout: 2000, selectOnCopy: true });

  return (
    <Wrapper sx={{ position: "relative", pr: 1 }} closeOnSelection={false}>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...menuButtonStyles.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="share-menu"
      >
        <Icon name="share" />
        Share
      </MenuButton>
      <Menu
        sx={{
          ...menuButtonStyles.menu,
          ...{ width: "350px", p: 3 }
        }}
      >
        <ul sx={menuButtonStyles.menuList}>
          <li key={ShareMenuKeys.Share}>
            <MenuItem value={ShareMenuKeys.Share}>
              <b>Shareable link</b> (read-only)
              <Flex sx={style.inputWrapper}>
                <Input
                  ref={clipboard.target}
                  value={window.location.toString()}
                  readOnly
                  sx={style.input}
                />
                <Tooltip content="Copied!" visible={clipboard.copied}>
                  <Button
                    onClick={() => {
                      clipboard.copy();
                    }}
                    sx={{ variant: "buttons.quiet" }}
                  >
                    <Icon name="clipboard" />
                  </Button>
                </Tooltip>
              </Flex>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default SupportMenu;
