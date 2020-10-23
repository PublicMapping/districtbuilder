/** @jsx jsx */
import React, { useEffect, useRef, useState } from "react";
import { Button, Flex, Input, jsx, Text } from "theme-ui";
import { IProject } from "../../shared/entities";
import { setProjectData } from "../actions/projectData";
import { patchProject } from "../api";
import { showActionFailedToast } from "../functions";
import store from "../store";
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

type FormState = "view" | "editing" | "pending";

export default ({
  project,
  isReadOnly
}: {
  readonly project?: IProject;
  readonly isReadOnly: boolean;
}) => {
  const [formState, setFormState] = useState<FormState>("view");
  const [name, setName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    project && setName(project.name);
  }, [project]);

  useEffect(() => {
    formState === "editing" && inputRef.current && inputRef.current.focus();
  }, [inputRef, formState]);

  return (
    <Flex sx={style.wrapper}>
      {formState === "editing" || formState === "pending" ? (
        <Flex
          as="form"
          onSubmit={e => {
            e.preventDefault();
            setFormState("pending");
            project &&
              void patchProject(project.id, { name })
                .then(project => {
                  setFormState("view");
                  store.dispatch(setProjectData(project));
                })
                .catch(() => {
                  setFormState("editing");
                  showActionFailedToast();
                });
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
            onClick={() => {
              setName(project?.name || "");
              setFormState("view");
            }}
            disabled={formState === "pending"}
          >
            <Icon name="times-circle" />
          </Button>
          <Button sx={style.button} type="submit" disabled={!name || formState === "pending"}>
            <Icon name="check" />
          </Button>
        </Flex>
      ) : (
        <React.Fragment>
          <Text as="h1" sx={{ variant: "header.title", m: 0 }}>
            {project && isReadOnly
              ? `${project.name} by ${project.user.name}`
              : project
              ? project.name
              : "..."}
          </Text>
          {!isReadOnly && (
            <Button sx={style.button} onClick={() => setFormState("editing")} disabled={!project}>
              <Icon name="pencil" />
            </Button>
          )}
        </React.Fragment>
      )}
    </Flex>
  );
};
