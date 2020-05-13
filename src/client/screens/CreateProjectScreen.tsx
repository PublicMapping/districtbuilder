/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Label, Radio } from "theme-ui";

import { IProject, IRegionConfig } from "../../shared/entities";
import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject } from "../api";
import { InputField, SelectField } from "../components/Field";
import { State } from "../reducers";
import { RegionConfigState } from "../reducers/regionConfig";
import { WriteResource } from "../resource";
import store from "../store";

interface StateProps {
  readonly regionConfigs: RegionConfigState;
}

const validate = (form: ProjectForm) =>
  form.name.trim() !== "" && form.numberOfDistricts !== null && form.regionConfig !== null
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface ProjectForm {
  readonly name: string;
  readonly regionConfig: IRegionConfig | null;
  readonly numberOfDistricts: number | null;
  readonly isCustom: boolean;
}

interface ValidForm {
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly numberOfDistricts: number;
  readonly isCustom: boolean;
  readonly valid: true;
}

interface InvalidForm extends ProjectForm {
  readonly valid: false;
}

const CreateProjectScreen = ({ regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);
  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ProjectForm, IProject>
  >({
    data: {
      name: "",
      regionConfig: null,
      numberOfDistricts: null,
      isCustom: false
    }
  });
  const { data } = createProjectResource;

  const onDistrictChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chamber =
      data.regionConfig !== null
        ? data.regionConfig.chambers.find(chamber => chamber.id === e.currentTarget.value)
        : null;
    setCreateProjectResource({
      data: {
        ...data,
        ...(chamber
          ? {
              numberOfDistricts: chamber.numberOfDistricts,
              isCustom: false
            }
          : { numberOfDistricts: null, isCustom: true })
      }
    });
  };

  return "resource" in createProjectResource ? (
    <Redirect to="/" />
  ) : (
    <Flex
      sx={{
        flexDirection: "column",
        minHeight: "100vh"
      }}
    >
      <Heading as="h4" sx={{ textAlign: "left", backgroundColor: "accent", color: "white", p: 3 }}>
        New Project
      </Heading>
      <Flex as="main" sx={{ width: "100%" }}>
        <Flex
          sx={{
            width: "100%",
            maxWidth: "form",
            mx: "auto",
            flexDirection: "column"
          }}
        >
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(data);
              // tslint:disable-next-line no-if-statement
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data, isPending: true });
                createProject({
                  ...validatedForm,
                  numberOfDistricts: validatedForm.numberOfDistricts
                })
                  .then((project: IProject) =>
                    setCreateProjectResource({ data, resource: project })
                  )
                  .catch(errors => setCreateProjectResource({ data, errors }));
              }
            }}
          >
            <Card sx={{ backgroundColor: "muted", my: 2, p: 4 }}>
              <InputField
                field="name"
                label="Name"
                resource={createProjectResource}
                inputProps={{
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateProjectResource({
                      data: { ...data, name: e.currentTarget.value }
                    })
                }}
              />
            </Card>
            <Card sx={{ backgroundColor: "muted", my: 2, p: 4 }}>
              <SelectField
                field="regionConfig"
                label="State"
                resource={createProjectResource}
                selectProps={{
                  onChange:
                    "resource" in regionConfigs
                      ? (e: React.ChangeEvent<HTMLSelectElement>) => {
                          const regionConfig = regionConfigs.resource.find(
                            regionConfig => regionConfig.id === e.currentTarget.value
                          );
                          setCreateProjectResource({
                            data: { ...data, regionConfig: regionConfig || null }
                          });
                        }
                      : undefined
                }}
              >
                <option>Select region</option>
                {"resource" in regionConfigs
                  ? regionConfigs.resource.map(regionConfig => (
                      <option key={regionConfig.id} value={regionConfig.id}>
                        {regionConfig.name}
                      </option>
                    ))
                  : null}
              </SelectField>
            </Card>
            {data.regionConfig ? (
              <Card sx={{ backgroundColor: "muted", my: 2, p: 4 }}>
                <Label>Districts</Label>
                {data.regionConfig &&
                  data.regionConfig.chambers
                    .map(chamber => (
                      <Label key={chamber.id} sx={{ display: "inline-flex", width: "50%" }}>
                        <Radio
                          name="project-district"
                          value={chamber.id}
                          onChange={onDistrictChanged}
                        />
                        <Flex as="span" sx={{ flexDirection: "column" }}>
                          <span sx={{ display: "block", color: "heading" }}>{chamber.name}</span>
                          {chamber.numberOfDistricts} districts
                        </Flex>
                      </Label>
                    ))
                    .concat(
                      <Label key="" sx={{ display: "inline-flex", width: "50%" }}>
                        <Radio name="project-district" value="" onChange={onDistrictChanged} />
                        <Flex as="span" sx={{ flexDirection: "column" }}>
                          <span sx={{ display: "block", color: "heading" }}>Custom</span>
                          Define other types of districts
                        </Flex>
                      </Label>
                    )}
                {data.isCustom ? (
                  <InputField
                    field="numberOfDistricts"
                    label="Number of districts"
                    resource={createProjectResource}
                    inputProps={{
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = parseInt(e.currentTarget.value, 10);
                        const numberOfDistricts = isNaN(value) ? null : value;
                        setCreateProjectResource({
                          data: {
                            ...data,
                            numberOfDistricts,
                            isCustom: true
                          }
                        });
                      }
                    }}
                  />
                ) : null}
              </Card>
            ) : (
              undefined
            )}
            <Box sx={{ textAlign: "left" }}>
              <Button
                type="submit"
                disabled={
                  (("isPending" in createProjectResource && createProjectResource.isPending) ||
                    !validate(data).valid) &&
                  !("errorMessage" in createProjectResource)
                }
              >
                Create project
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    regionConfigs: state.regionConfig
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
