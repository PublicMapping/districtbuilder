/** @jsx jsx */
import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Button, Flex, Input, jsx, Text } from "theme-ui";
import { IProject } from "../../shared/entities";
import { setProjectNameEditing, updateProjectName } from "../actions/projectData";
import { State } from "../reducers";
import store from "../store";
import { SavingState } from "../types";
import Icon from "./Icon";

const style = {
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    projectNameSaving === "saved" && setName(project.name);
  }, [projectNameSaving, project]);

  useEffect(() => {
    projectNameSaving === "unsaved" && inputRef.current && inputRef.current.focus();
  }, [inputRef, projectNameSaving]);

  return (
    <Flex sx={style.wrapper}>
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
          {!isReadOnly && (
            <Button sx={style.button} onClick={() => store.dispatch(setProjectNameEditing(true))}>
              <Icon name="pencil" />
            </Button>
          )}
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
