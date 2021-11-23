/** @jsx jsx */
import React, { useEffect, useRef, useState } from "react";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Box, Button, Flex, Heading, Input, jsx, Styled, Text } from "theme-ui";
import { IProject, IProjectTemplate } from "../../shared/entities";
import {
  setProjectNameEditing,
  updateProjectName,
  toggleProjectDetailsModal
} from "../actions/projectData";
import { State } from "../reducers";
import store from "../store";
import { SavingState } from "../types";
import Icon from "./Icon";
import { style as menuButtonStyles } from "./MenuButton.styles";

const style = {
  modal: {
    bg: "muted",
    p: 5,
    width: "small",
    maxWidth: "90vw",
    overflow: "hidden",
    flexDirection: "column"
  },
  button: {
    variant: "buttons.icon",
    color: "muted",
    ml: 2
  },
  input: {
    py: 1,
    my: -1
  },
  wrapper: {
    color: "muted",
    alignItems: "center"
  }
} as const;

enum MenuKeys {
  Rename = "Rename",
  Config = "Config",
  AboutTemplate = "AboutTemplate"
}

const ProjectName = ({
  project,
  projectNameSaving,
  saving,
  isReadOnly
}: {
  readonly project: IProject;
  readonly saving: SavingState;
  readonly projectNameSaving: SavingState;
  readonly isReadOnly: boolean;
}) => {
  const [name, setName] = useState(project.name);
  const [modalVisible, setModalVisibility] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    projectNameSaving === "saved" && setName(project.name);
  }, [projectNameSaving, project]);

  useEffect(() => {
    projectNameSaving === "unsaved" && inputRef.current && inputRef.current.focus();
  }, [inputRef, projectNameSaving]);

  const EditButton = (
    <Wrapper
      sx={{ position: "relative", pr: 1 }}
      closeOnSelection={true}
      onSelection={(menuKey: string) => {
        if (menuKey === MenuKeys.Rename) {
          store.dispatch(setProjectNameEditing(true));
        } else if (menuKey === MenuKeys.AboutTemplate) {
          setModalVisibility(true);
        } else if (menuKey === MenuKeys.Config) {
          store.dispatch(toggleProjectDetailsModal());
        }
      }}
    >
      <MenuButton
        sx={{
          ...menuButtonStyles.menuButton,
          ...{
            variant: "buttons.icon",
            height: "20px",
            color: "muted",

            ml: 2
          }
        }}
        className="share-menu"
      >
        ···
      </MenuButton>
      <Menu
        sx={{
          ...menuButtonStyles.menu,
          ...{ width: "250px", color: "text", right: undefined }
        }}
      >
        <ul sx={menuButtonStyles.menuList}>
          <li key={MenuKeys.Rename}>
            <MenuItem value={MenuKeys.Rename}>
              <Box sx={menuButtonStyles.menuListItem}>Rename map</Box>
            </MenuItem>
          </li>
          <li key={MenuKeys.Config}>
            <MenuItem value={MenuKeys.Config}>
              <Box sx={menuButtonStyles.menuListItem}>Map configuration</Box>
            </MenuItem>
          </li>
          {project.projectTemplate && (
            <li key={MenuKeys.AboutTemplate}>
              <MenuItem value={MenuKeys.AboutTemplate}>
                <Box sx={menuButtonStyles.menuListItem}>
                  About “{project.projectTemplate.name}” template
                </Box>
              </MenuItem>
            </li>
          )}
        </ul>
      </Menu>
    </Wrapper>
  );

  const TemplateModal = ({ template }: { readonly template: IProjectTemplate }) => (
    <AriaModal
      titleId="copy-map-modal-header"
      onExit={() => setModalVisibility(false)}
      focusDialog={true}
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Flex sx={style.modal}>
        <Styled.a as={Link} to={`/o/${template.organization.slug}`}>
          {template.organization.name} ›
        </Styled.a>
        <Heading>{template.name}</Heading>
        <Text sx={{ mb: 2 }}>
          {template.regionConfig.name} · {template.numberOfDistricts} districts
        </Text>
        <Text>{template.description}</Text>
        <Heading as="h4" sx={{ mt: 4 }}>
          Details
        </Heading>
        <Text>{template.details}</Text>
      </Flex>
    </AriaModal>
  );

  return (
    <Flex sx={style.wrapper}>
      {modalVisible && project.projectTemplate && (
        <TemplateModal template={project.projectTemplate} />
      )}
      {projectNameSaving !== "saved" ? (
        <Flex
          as="form"
          onSubmit={e => {
            e.preventDefault();
            store.dispatch(updateProjectName(name));
          }}
        >
          <Input
            sx={style.input}
            value={name}
            onChange={e => setName(e.target.value)}
            ref={inputRef}
          />
          <Button
            type="button"
            sx={style.button}
            onClick={() => store.dispatch(setProjectNameEditing(false))}
            disabled={projectNameSaving === "saving"}
          >
            <Icon name="times-circle" />
          </Button>
          <Button
            sx={style.button}
            type="submit"
            disabled={name === "" || projectNameSaving === "saving" || saving === "saving"}
          >
            <Icon name="check" />
          </Button>
        </Flex>
      ) : (
        <React.Fragment>
          <Text as="h1" sx={{ variant: "header.title", m: 0 }}>
            {isReadOnly ? `${project.name} by ${project.user.name}` : project.name}
          </Text>
          {!isReadOnly && EditButton}
        </React.Fragment>
      )}
    </Flex>
  );
};

function mapStateToProps(state: State) {
  return {
    projectNameSaving: state.project.projectNameSaving,
    saving: state.project.saving
  };
}

export default connect(mapStateToProps)(ProjectName);
