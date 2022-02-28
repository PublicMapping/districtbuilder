/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject, Select, Label } from "theme-ui";

import Icon from "./Icon";
import { IProject, IProjectTemplate, OrganizationNest } from "../../shared/entities";
import { setTemplateProject } from "../actions/projects";
import { State } from "../reducers";
import store from "../store";
import React, { useState } from "react";
import { WriteResource } from "../resource";
import { InputField } from "./Field";
import { createProjectTemplate } from "../api";
import { useHistory } from "react-router-dom";

const style: Record<string, ThemeUIStyleObject> = {
  modal: {
    bg: "muted",
    p: 3,
    width: "small",
    maxWidth: "90vw"
  },
  header: {
    bg: "error",
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  footer: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2,
    fontSize: 1
  }
};

interface Form {
  readonly organization?: OrganizationNest;
  readonly description: string;
  readonly details: string;
}

function validate(form: Form): boolean {
  return form.organization !== undefined && form.description !== "" && form.details !== "";
}

const TemplateFromProjectModal = ({
  project,
  adminOrganizations
}: {
  readonly project?: IProject;
  readonly adminOrganizations: readonly OrganizationNest[];
}) => {
  const history = useHistory();
  const hideModal = () => store.dispatch(setTemplateProject(undefined));
  const [resource, setResource] = useState<WriteResource<Form, IProjectTemplate>>({
    data: {
      organization: adminOrganizations.length === 1 ? adminOrganizations[0] : undefined,
      description: "",
      details: ""
    }
  });

  return project !== undefined && adminOrganizations.length !== 0 ? (
    <AriaModal
      titleId="template-project-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-template-project"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box
        sx={style.modal}
        as="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          const { description, details } = resource.data;
          const slug = resource.data.organization?.slug;

          if (slug) {
            setResource({ ...resource, isPending: true });
            createProjectTemplate(slug, {
              description,
              details,
              project: { id: project.id }
            })
              .then(() => {
                hideModal();
                history.push(`/o/${slug}`);
              })
              .catch(errors => {
                setResource({ ...resource, errors });
              });
          }
        }}
      >
        <Box sx={style.header}>
          <Heading
            as="h3"
            sx={{
              marginBottom: "0",
              fontWeight: "medium",
              display: "flex",
              alignItems: "center",
              color: "muted"
            }}
            id="template-project-modal-header"
          >
            <span sx={{ fontSize: 4, mr: 2, display: "flex" }}>
              <Icon name="alert-triangle" />
            </span>
            Create Template from Map
          </Heading>
        </Box>
        <Box>
          {/* If the user is only the admin of 1 organization, they don't need a dropdown */}
          {adminOrganizations.length > 1 && (
            <Select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const organization = adminOrganizations.find(
                  org => org.slug === e.currentTarget.value
                );
                setResource({ ...resource, data: { ...resource.data, organization } });
              }}
            >
              <option>Select organization...</option>
              {adminOrganizations.map(org => (
                <option key={org.slug} value={org.slug}>
                  {org.name}
                </option>
              ))}
            </Select>
          )}
        </Box>
        <Box>
          <InputField
            field="description"
            label="Description"
            resource={resource}
            inputProps={{
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const description = e.currentTarget.value;
                setResource({ ...resource, data: { ...resource.data, description } });
              }
            }}
          />
        </Box>
        <Box>
          <Label>Details</Label>
          <textarea
            sx={{ width: "100%", resize: "vertical", minHeight: "4rem" }}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const details = e.currentTarget.value;
              setResource({ ...resource, data: { ...resource.data, details } });
            }}
          ></textarea>
        </Box>
        <Box>
          {`Do you want to create a template from “${project.name}” for the “${
            resource.data.organization?.name || "—"
          }” organization?`}
        </Box>
        <Flex sx={style.footer}>
          <Button
            id="cancel-template-project"
            onClick={hideModal}
            type="button"
            sx={{ variant: "buttons.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            sx={{ variant: "buttons.danger" }}
            disabled={("isPending" in resource && resource.isPending) || !validate(resource.data)}
            type="submit"
          >
            Create template
          </Button>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    project: state.projects.templateProject
  };
}

export default connect(mapStateToProps)(TemplateFromProjectModal);
