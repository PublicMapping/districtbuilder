/** @jsx jsx */
import { Box, Button, Input, Flex, jsx, Label, Radio } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { useClipboard } from "use-clipboard-copy";

import { ProjectVisibility } from "../../shared/constants";
import { IProject } from "../../shared/entities";
import { updateProjectVisibility } from "../actions/projectData";
import Icon from "../components/Icon";
import store from "../store";
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
  },
  menuItem: {
    flexDirection: "row"
  },
  radio: {
    width: "space.6",
    flex: "none"
  }
} as const;

enum ShareMenuKeys {
  Private = "Private",
  Visible = "Visible",
  Published = "Published"
}

interface ShareProps {
  readonly invert?: boolean;
  readonly project?: IProject;
}

const ShareMenu = ({ invert, project }: ShareProps) => {
  const clipboard = useClipboard({ copiedTimeout: 2000, selectOnCopy: true });

  const onVisibilityChanged = (shareMenuKey: string) => {
    store.dispatch(
      updateProjectVisibility(ProjectVisibility[shareMenuKey as keyof typeof ProjectVisibility])
    );
  };

  return (
    <Wrapper
      sx={{ position: "relative", pr: 1 }}
      closeOnSelection={false}
      onSelection={onVisibilityChanged}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...menuButtonStyles.menuButton,
          ...invertStyles({ invert })
        }}
        className="share-menu"
      >
        <Icon
          name={
            project?.visibility === ProjectVisibility.Visible
              ? "link"
              : project?.visibility === ProjectVisibility.Published
              ? "eye"
              : "lock-locked"
          }
        />
        Share
      </MenuButton>
      <Menu
        sx={{
          ...menuButtonStyles.menu,
          ...{ width: "350px", p: 3 }
        }}
      >
        <ul sx={menuButtonStyles.menuList}>
          <li key={ShareMenuKeys.Private}>
            <MenuItem value={ShareMenuKeys.Private}>
              <Flex sx={style.menuItem}>
                <Box sx={style.radio}>
                  <Radio
                    name="project-share"
                    value={ProjectVisibility.Private}
                    onChange={e => onVisibilityChanged(e.target.value)}
                    checked={project?.visibility === ProjectVisibility.Private}
                    aria-describedby="project-share-private"
                  />
                </Box>
                <Box>
                  <Label>Private</Label>
                  <Box as="span" id="project-share-private">
                    Only you can view
                  </Box>
                </Box>
              </Flex>
            </MenuItem>
          </li>
          <li key={ShareMenuKeys.Visible}>
            <MenuItem value={ShareMenuKeys.Visible}>
              <Flex sx={style.menuItem}>
                <Box sx={style.radio}>
                  <Radio
                    name="project-share"
                    value={ProjectVisibility.Visible}
                    onChange={e => onVisibilityChanged(e.target.value)}
                    checked={project?.visibility === ProjectVisibility.Visible}
                    aria-describedby="project-share-visible"
                  />
                </Box>
                <Box>
                  <Label>Only share with link</Label>
                  <Box as="span" id="project-share-visible">
                    Anyone with the link can view
                  </Box>
                </Box>
              </Flex>
            </MenuItem>
          </li>
          <li key={ShareMenuKeys.Published}>
            <MenuItem value={ShareMenuKeys.Published}>
              <Flex sx={style.menuItem}>
                <Box sx={style.radio}>
                  <Radio
                    name="project-share"
                    value={ProjectVisibility.Published}
                    onChange={e => onVisibilityChanged(e.target.value)}
                    checked={project?.visibility === ProjectVisibility.Published}
                    aria-describedby="project-share-published"
                  />
                </Box>
                <Box>
                  <Label>Published</Label>
                  <Box as="span" id="project-share-published">
                    Anyone on the DistrictBuilder website or with the link can view
                  </Box>
                </Box>
              </Flex>
            </MenuItem>
          </li>
          {(project?.visibility === ProjectVisibility.Visible ||
            project?.visibility === ProjectVisibility.Published) && (
            <li>
              <b>Shareable link</b>
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
            </li>
          )}
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ShareMenu;
