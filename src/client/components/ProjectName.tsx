/** @jsx jsx */
import React, { useEffect, useRef, useState } from "react";
import { Button, Flex, Input, jsx, Text } from "theme-ui";
import { IProject } from "../../shared/entities";
import { setProjectData } from "../actions/projectData";
import { WriteResource } from "../resource";
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

export default ({
  project,
  isReadOnly
}: {
  readonly project: IProject;
  readonly isReadOnly: boolean;
}) => {
  const [resource, setResource] = useState<WriteResource<string, void>>({
    data: project.name,
    resource: void 0
  });
  const [currentProject, setProject] = useState<IProject | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = !("resource" in resource);

  useEffect(() => {
    // Reset form whenever project changes
    !("resource" in resource) &&
      project !== currentProject &&
      setResource({ data: project.name, resource: void 0 });
  }, [project, resource, currentProject]);

  useEffect(() => {
    editing && inputRef.current && inputRef.current.focus();
  }, [inputRef, editing]);

  return (
    <Flex sx={style.wrapper}>
      {editing ? (
        <Flex
          as="form"
          onSubmit={e => {
            e.preventDefault();
            setResource({ ...resource, isPending: true });
            store.dispatch(setProjectData({ name: resource.data }));
          }}
        >
          <Input
            sx={style.input}
            value={resource.data}
            onChange={e => setResource({ data: e.target.value })}
            ref={inputRef}
          />
          <Button
            type="button"
            sx={style.button}
            onClick={() => {
              setResource({ data: project.name, resource: void 0 });
            }}
            disabled={"isPending" in resource}
          >
            <Icon name="times-circle" />
          </Button>
          <Button
            sx={style.button}
            type="submit"
            disabled={!resource.data || "isPending" in resource}
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
            <Button
              sx={style.button}
              onClick={() => {
                setProject(project);
                setResource({ data: resource.data });
              }}
              disabled={!project}
            >
              <Icon name="pencil" />
            </Button>
          )}
        </React.Fragment>
      )}
    </Flex>
  );
};
