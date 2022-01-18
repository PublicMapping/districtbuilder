/** @jsx jsx */
import React, { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { InputField } from "./Field";
import {
  Box,
  Button,
  Flex,
  Heading,
  jsx,
  ThemeUIStyleObject,
  Label,
  Checkbox,
  Divider
} from "theme-ui";

import { IProject } from "../../shared/entities";
import { State } from "../reducers";
import store from "../store";
import { toggleProjectDetailsModal, updateProjectDetailsSuccess } from "../actions/projectData";
import { WriteResource } from "../resource";
import FormError from "./FormError";
import { DistrictsGeoJSON } from "../types";
import MultiMemberForm from "./MultiMemberForm";
import { patchProject } from "../api";
import { extractErrors } from "../functions";

const style: Record<string, ThemeUIStyleObject> = {
  footer: {
    marginTop: 5
  },
  header: {
    mb: 5
  },
  heading: {
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: 4
  },
  helpText: {
    fontSize: "13px",
    textTransform: "none",
    fontWeight: "normal"
  },
  label: {
    fontSize: "16px",
    color: "heading",
    fontWeight: "bold",
    textTransform: "none"
  },
  modal: {
    bg: "muted",
    p: 5,
    width: "small",
    maxWidth: "90vw",
    overflow: "visible"
  },
  customInputContainer: {
    width: "100%",
    mb: 5
  },
  multiMemberContainer: {
    overflow: "hidden",
    maxHeight: "calc(100vh - 42rem)",
    width: "100%",
    "> div": {
      overflow: "auto",
      width: "100%",
      flex: "0 0 auto",
      maxHeight: "inherit"
    },
    thead: {
      position: "sticky",
      top: 0
    }
  }
};

const validate = (form: ConfigurableForm): ProjectDetailsForm => {
  const name = form.name;
  const populationDeviation = form.populationDeviation;
  const numberOfMembers = form.numberOfMembers;
  const isMultiMember = form.isMultiMember;

  return name && populationDeviation !== null && numberOfMembers !== null
    ? {
        name,
        populationDeviation,
        numberOfMembers,
        isMultiMember,
        valid: true
      }
    : {
        name,
        populationDeviation,
        numberOfMembers,
        isMultiMember,
        valid: false
      };
};

type ProjectDetailsForm = ValidForm | InvalidForm;

interface ValidForm {
  readonly name: string;
  readonly populationDeviation: number;
  readonly numberOfMembers: readonly number[];
  readonly isMultiMember: boolean;
  readonly valid: true;
}

interface InvalidForm {
  readonly name: string | null;
  readonly populationDeviation: number | null;
  readonly numberOfMembers: readonly number[];
  readonly isMultiMember: boolean;
  readonly valid: false;
}

interface ConfigurableForm {
  readonly name: string | null;
  readonly populationDeviation: number | null;
  readonly numberOfMembers: readonly number[];
  readonly isMultiMember: boolean;
}

const ProjectDetailModal = ({
  project,
  geojson,
  showModal
}: {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly showModal: boolean;
}) => {
  const totalPopulation = geojson.features.reduce(
    (total, feature) => total + feature.properties.demographics.population,
    0
  );

  const hideModal = () => store.dispatch(toggleProjectDetailsModal()) && resetForm();

  const blankForm: ConfigurableForm = {
    name: project.name,
    populationDeviation: project.populationDeviation,
    numberOfMembers: project.numberOfMembers,
    isMultiMember: project.numberOfMembers.some(num => num !== 1)
  };

  const [projectDetailsResource, setProjectDetailsResource] = useState<
    WriteResource<ConfigurableForm, void>
  >({
    data: blankForm
  });
  const formData = projectDetailsResource.data;

  function resetForm() {
    setProjectDetailsResource({ data: blankForm });
  }

  return showModal ? (
    <AriaModal
      titleId="edit-project-details-modal"
      onExit={hideModal}
      initialFocus="#primary-action"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <React.Fragment>
          <Box sx={style.header}>
            <Heading as="h1" sx={style.heading} id="project-details-header">
              Map configuration
            </Heading>
          </Box>
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(formData);
              if (validatedForm.valid === true) {
                setProjectDetailsResource({ data: formData, isPending: true });
                const projectData = {
                  name: validatedForm.name,
                  populationDeviation: validatedForm.populationDeviation,
                  numberOfMembers: validatedForm.numberOfMembers
                };

                patchProject(project.id, projectData)
                  .then((project: IProject) => {
                    store.dispatch(updateProjectDetailsSuccess({ project, geojson }));
                  })
                  .catch(errors => {
                    setProjectDetailsResource({ data: formData, errors });
                  });
              }
            }}
          >
            <Box>
              <Flex sx={{ flexWrap: "wrap" }}>
                <Box sx={style.customInputContainer}>
                  <FormError resource={projectDetailsResource} />
                  <InputField
                    field="name"
                    label={
                      <Box as="span" sx={style.label}>
                        Map name
                      </Box>
                    }
                    description={
                      <Box as="span" sx={style.helpText}>
                        e.g. ‘Arizona House of Representatives’. Make it specific to help tell your
                        maps apart.
                      </Box>
                    }
                    resource={projectDetailsResource}
                    inputProps={{
                      value: formData.name || "",
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setProjectDetailsResource({
                          data: { ...formData, name: e.currentTarget.value }
                        })
                    }}
                  />
                </Box>
                <Box sx={style.customInputContainer}>
                  <Box sx={style.label}>Districts</Box>
                  <Label
                    sx={{
                      display: "inline-flex"
                    }}
                  >
                    <Checkbox
                      name="project-is-multi-member"
                      checked={formData.isMultiMember}
                      onChange={() =>
                        setProjectDetailsResource({
                          data: { ...formData, isMultiMember: !formData.isMultiMember }
                        })
                      }
                    />
                    <Flex as="span">Use multi-member districts</Flex>
                  </Label>
                  {formData.isMultiMember ? (
                    <Box sx={style.multiMemberContainer}>
                      <Box>
                        <MultiMemberForm
                          errors={extractErrors(projectDetailsResource, "numberOfMembers")}
                          totalPopulation={totalPopulation}
                          numberOfMembers={formData.numberOfMembers}
                          onChange={numberOfMembers => {
                            setProjectDetailsResource({ data: { ...formData, numberOfMembers } });
                          }}
                        />
                      </Box>
                    </Box>
                  ) : null}
                </Box>

                <Box sx={style.customInputContainer}>
                  <InputField
                    field="populationDeviation"
                    label={
                      <Box as="span" sx={style.label}>
                        Population deviation tolerance (%)
                      </Box>
                    }
                    description={
                      <Box as="span" sx={style.helpText}>
                        How detailed of a map do you want to draw? Setting a lower tolerance means
                        the population of your districts will need to be more exact. If you
                        aren&apos;t sure, we think 5% is a good starting point.
                      </Box>
                    }
                    resource={projectDetailsResource}
                    inputProps={{
                      value:
                        formData.populationDeviation !== null ? formData.populationDeviation : "",
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.currentTarget.value);
                        const populationDeviation = isNaN(value) ? null : value;
                        setProjectDetailsResource({
                          data: {
                            ...formData,
                            populationDeviation
                          }
                        });
                      }
                    }}
                  />
                </Box>
              </Flex>
            </Box>

            <Divider />
            <Flex sx={style.footer}>
              <Button
                id="primary-action"
                type="submit"
                disabled={
                  !validate(formData).valid ||
                  ("isPending" in projectDetailsResource && projectDetailsResource.isPending)
                }
              >
                Save changes
              </Button>
              <Button sx={{ ml: 2, variant: "buttons.subtle" }} onClick={() => hideModal()}>
                Cancel
              </Button>
            </Flex>
          </Flex>
        </React.Fragment>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showProjectDetailsModal
  };
}

export default connect(mapStateToProps)(ProjectDetailModal);
