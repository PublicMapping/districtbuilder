/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Link, Redirect, useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Flex,
  Heading,
  jsx,
  Label,
  Radio,
  Styled,
  ThemeUIStyleObject
} from "theme-ui";

import { DEFAULT_POPULATION_DEVIATION } from "../../shared/constants";
import { CreateProjectData, IChamber, IProject, IRegionConfig } from "../../shared/entities";

import { regionConfigsFetch } from "../actions/regionConfig";
import { userFetch } from "../actions/user";
import { createProject, fetchTotalPopulation } from "../api";
import { InputField, SelectField } from "../components/Field";
import FormError from "../components/FormError";
import MultiMemberForm from "../components/MultiMemberForm";
import OrganizationTemplateForm from "../components/OrganizationTemplateForm";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { UserState } from "../reducers/user";
import { Resource, WriteResource } from "../resource";
import store from "../store";
import { updateNumberOfMembers, extractErrors } from "../functions";

interface StateProps {
  readonly regionConfigs: Resource<readonly IRegionConfig[]>;
  readonly organization: OrganizationState;
  readonly user: UserState;
}

const validate = (form: ProjectForm) =>
  form.name.trim() !== "" &&
  form.numberOfDistricts !== null &&
  form.numberOfMembers !== null &&
  form.regionConfig !== null
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface ProjectForm {
  readonly name: string;
  readonly chamber: IChamber | null;
  readonly regionConfig: IRegionConfig | null;
  readonly numberOfDistricts: number | null;
  readonly populationDeviation: number | null;
  readonly numberOfMembers: readonly number[] | null;
  readonly isMultiMember: boolean;
  readonly isCustom: boolean;
}

interface ValidForm {
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly chamber?: IChamber;
  readonly numberOfDistricts: number;
  readonly populationDeviation: number;
  readonly numberOfMembers: readonly number[];
  readonly isMultiMember: boolean;
  readonly isCustom: boolean;
  readonly valid: true;
}

interface InvalidForm extends ProjectForm {
  readonly valid: false;
}

const style: ThemeUIStyleObject = {
  header: {
    py: 3,
    px: 5,
    alignItems: "center",
    bg: "blue.8",
    borderBottom: "1px solid",
    borderColor: "blue.7",
    boxShadow: "bright"
  },
  formContainer: {
    width: "100%",
    maxWidth: "640px",
    mt: 6,
    mb: 7,
    mx: "auto",
    display: "block",
    flexDirection: "column",
    "@media screen and (max-width: 770px)": {
      width: "95%",
      my: 2
    }
  },
  cardLabel: {
    textTransform: "none",
    variant: "text.h5",
    display: "block",
    mb: 1
  },
  cardHint: {
    display: "block",
    textTransform: "none",
    fontWeight: "500",
    fontSize: 1,
    mt: 2,
    mb: 3
  },
  radioHeading: {
    textTransform: "none",
    variant: "text.body",
    fontSize: 2,
    lineHeight: "heading",
    letterSpacing: "0",
    mb: "0",
    color: "heading",
    fontWeight: "body"
  },
  radioSubHeading: {
    fontSize: 1,
    letterSpacing: "0",
    textTransform: "none",
    fontWeight: "500"
  },
  customInputContainer: {
    mt: 2,
    width: "100%",
    pt: 4,
    borderTop: "1px solid",
    borderColor: "gray.2"
  },
  legend: {
    paddingInlineStart: "0",
    paddingInlineEnd: "0"
  },
  fieldset: {
    border: "none",
    marginInlineStart: "0",
    marginInlineEnd: "0",
    paddingInlineStart: "0",
    paddingInlineEnd: "0",
    paddingBlockEnd: "0"
  },
  orgCardLabel: {
    mt: "5px"
  },
  orgCardSubtitle: {
    mb: "10px"
  }
};

const CreateProjectScreen = ({ regionConfigs, user, organization }: StateProps) => {
  const history = useHistory();
  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ProjectForm, IProject>
  >({
    data: {
      name: "",
      regionConfig: null,
      chamber: null,
      numberOfDistricts: null,
      populationDeviation: DEFAULT_POPULATION_DEVIATION,
      numberOfMembers: null,
      isMultiMember: false,
      isCustom: false
    }
  });
  const { data } = createProjectResource;
  const [totalPopulation, setTotalPopulation] = useState<number | null>(null);

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
              numberOfMembers:
                chamber.numberOfMembers || new Array(chamber.numberOfDistricts).fill(1),
              isMultiMember: chamber.numberOfMembers?.some(num => num > 1) || false,
              chamber: chamber || null,
              isCustom: false
            }
          : {
              numberOfDistricts: null,
              numberOfMembers: null,
              isCustom: true,
              isMultiMember: false,
              chamber: null
            })
      }
    });
  };

  function setupProjectFromTemplate(data: CreateProjectData) {
    return createProject(data).then((project: IProject) => history.push(`/projects/${project.id}`));
  }

  useEffect(() => {
    store.dispatch(regionConfigsFetch());
    store.dispatch(userFetch());
  }, []);

  useEffect(() => {
    data.regionConfig &&
      fetchTotalPopulation(data.regionConfig).then(population => setTotalPopulation(population));
  }, [data.regionConfig]);

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : (
    <Flex
      sx={{
        flexDirection: "column",
        minHeight: "100vh"
      }}
    >
      <Flex sx={style.header}>
        <Box as="h1" sx={{ lineHeight: "0", mr: 3 }}>
          <Link
            to="/"
            sx={{
              lineHeight: "0",
              borderRadius: "small",
              "&:focus": {
                outline: "none",
                boxShadow: "focus"
              }
            }}
          >
            <Logo sx={{ width: "1.8rem" }} />
          </Link>
        </Box>
        <Heading as="h2" sx={{ variant: "text.h5", color: "blue.0", my: 0 }}>
          New map
        </Heading>
      </Flex>
      <Flex as="main" sx={{ width: "100%", display: "block" }}>
        <Flex sx={style.formContainer}>
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(data);
              // Disabling 'functional/no-conditional-statement' without naming it.
              // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
              // eslint-disable-next-line
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data, isPending: true });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { isCustom, isMultiMember, valid, ...validatedData } = validatedForm;
                createProject({
                  ...validatedData,
                  chamber: validatedForm.chamber || undefined,
                  populationDeviation: validatedForm.populationDeviation,
                  numberOfDistricts: validatedForm.numberOfDistricts
                })
                  .then((project: IProject) =>
                    setCreateProjectResource({ data, resource: project })
                  )
                  .catch(errors => setCreateProjectResource({ data, errors }));
              }
            }}
          >
            {"resource" in user && (
              <OrganizationTemplateForm
                organization={"resource" in organization ? organization.resource : undefined}
                templateSelected={setupProjectFromTemplate}
                organizations={user.resource.organizations}
                user={user.resource}
              />
            )}
            {!("resource" in organization) && (
              <React.Fragment>
                <Card sx={{ variant: "card.flat" }}>
                  <FormError resource={createProjectResource} />
                  <InputField
                    field="name"
                    label={
                      <Box as="span" sx={style.cardLabel}>
                        Map name
                      </Box>
                    }
                    description={
                      <Box as="span" sx={style.cardHint}>
                        e.g. ‘Arizona House of Representatives’. Make it specific to help tell your
                        maps apart.
                      </Box>
                    }
                    resource={createProjectResource}
                    inputProps={{
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateProjectResource({
                          data: { ...data, name: e.currentTarget.value }
                        })
                    }}
                  />
                </Card>
                <Card sx={{ variant: "card.flat" }}>
                  <SelectField
                    field="regionConfig"
                    sx={{ width: "1000px" }}
                    label={
                      <Box as="span" sx={style.cardLabel}>
                        State
                      </Box>
                    }
                    description={
                      <Box as="span" sx={style.cardHint}>
                        What state do you want to map? If you don’t see it in the list,{" "}
                        <Styled.a
                          href="https://districtbuilder.us1.list-manage.com/subscribe?u=61da999c9897859f1c1fff262&id=70fdf1ae35"
                          target="_blank"
                        >
                          sign up for our mailing list
                        </Styled.a>{" "}
                        to know when new states are available!
                      </Box>
                    }
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
                    <option>Select...</option>
                    {"resource" in regionConfigs
                      ? regionConfigs.resource
                          .filter(regionConfig => !regionConfig.hidden)
                          .map(regionConfig => (
                            <option key={regionConfig.id} value={regionConfig.id}>
                              {regionConfig.name}
                            </option>
                          ))
                      : null}
                  </SelectField>
                </Card>
                {data.regionConfig ? (
                  <React.Fragment>
                    <Card sx={{ variant: "card.flat" }}>
                      <fieldset sx={style.fieldset}>
                        <Flex sx={{ flexWrap: "wrap" }}>
                          <legend
                            sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}
                          >
                            Districts
                          </legend>
                          <Box
                            id="description-districts"
                            as="span"
                            sx={{ ...style.cardHint, ...{ flex: "0 0 100%" } }}
                          >
                            How many districts do you want to map? Choose a federal or state
                            legislative chamber or define your own.
                          </Box>
                          {data.regionConfig &&
                            [...data.regionConfig.chambers]
                              .sort((a, b) => a.numberOfDistricts - b.numberOfDistricts)
                              .map(chamber => (
                                <Label
                                  key={chamber.id}
                                  sx={{
                                    display: "inline-flex",
                                    "@media screen and (min-width: 750px)": {
                                      flex: "0 0 48%",
                                      "&:nth-of-type(even)": {
                                        mr: "2%"
                                      }
                                    }
                                  }}
                                >
                                  <Radio
                                    name="project-district"
                                    value={chamber.id}
                                    onChange={onDistrictChanged}
                                    aria-describedby="description-districts"
                                  />
                                  <Flex
                                    as="span"
                                    sx={{ flexDirection: "column", flex: "0 1 calc(100% - 2rem)" }}
                                  >
                                    <div sx={style.radioHeading}>{chamber.name}</div>
                                    <div sx={style.radioSubHeading}>
                                      {chamber.numberOfDistricts} districts
                                    </div>
                                  </Flex>
                                </Label>
                              ))
                              .concat(
                                <div
                                  sx={{
                                    flex: "0 0 50%",
                                    "@media screen and (max-width: 770px)": {
                                      flex: "0 0 100%"
                                    }
                                  }}
                                  key="custom"
                                >
                                  <Label>
                                    <Radio
                                      name="project-district"
                                      value=""
                                      onChange={onDistrictChanged}
                                    />
                                    <Flex as="span" sx={{ flexDirection: "column" }}>
                                      <div sx={style.radioHeading}>Custom</div>
                                      <div sx={style.radioSubHeading}>
                                        Define a custom number of districts
                                      </div>
                                    </Flex>
                                  </Label>
                                </div>
                              )}
                          {data.isCustom ? (
                            <Box sx={style.customInputContainer}>
                              <InputField
                                field="numberOfDistricts"
                                label="Number of districts"
                                resource={createProjectResource}
                                inputProps={{
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = parseInt(e.currentTarget.value, 10);
                                    const numberOfDistricts = isNaN(value) ? null : value;
                                    const numberOfMembers = updateNumberOfMembers(
                                      numberOfDistricts,
                                      data.numberOfMembers
                                    );
                                    setCreateProjectResource({
                                      data: {
                                        ...data,
                                        numberOfDistricts,
                                        numberOfMembers
                                      }
                                    });
                                  }
                                }}
                              />
                            </Box>
                          ) : null}
                          <Divider sx={{ width: "100%" }} />
                          <Box>
                            <Label
                              sx={{
                                display: "inline-flex"
                              }}
                            >
                              <Checkbox
                                name="project-is-multi-member"
                                checked={data.isMultiMember}
                                onChange={() =>
                                  setCreateProjectResource({
                                    data: { ...data, isMultiMember: !data.isMultiMember }
                                  })
                                }
                              />
                              <Flex as="span">Use multi-member districts</Flex>
                            </Label>
                          </Box>
                          {data.numberOfMembers && data.isMultiMember && totalPopulation ? (
                            <MultiMemberForm
                              errors={extractErrors(createProjectResource, "numberOfMembers")}
                              totalPopulation={totalPopulation}
                              numberOfMembers={data.numberOfMembers}
                              onChange={numberOfMembers => {
                                setCreateProjectResource({ data: { ...data, numberOfMembers } });
                              }}
                            />
                          ) : null}
                        </Flex>
                      </fieldset>
                    </Card>
                    <Card sx={{ variant: "card.flat" }}>
                      <Flex sx={{ flexWrap: "wrap" }}>
                        <legend
                          sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}
                        >
                          Population deviation tolerance
                        </legend>
                        <Box
                          id="description-districts"
                          as="span"
                          sx={{ ...style.cardHint, ...{ flex: "0 0 100%" } }}
                        >
                          How detailed of a map do you want to draw? Setting a lower tolerance means
                          the population of your districts will need to be more exact. If you
                          aren&apos;t sure, we think 5% is a good starting point.
                        </Box>
                        <Box sx={style.customInputContainer}>
                          <InputField
                            field="populationDeviation"
                            label="Population deviation tolerance (%)"
                            defaultValue={DEFAULT_POPULATION_DEVIATION}
                            resource={createProjectResource}
                            inputProps={{
                              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseFloat(e.currentTarget.value);
                                const populationDeviation = isNaN(value) ? null : value;
                                setCreateProjectResource({
                                  data: {
                                    ...data,
                                    populationDeviation
                                  }
                                });
                              }
                            }}
                          />
                        </Box>
                      </Flex>
                    </Card>
                  </React.Fragment>
                ) : (
                  undefined
                )}
                <Box sx={{ mt: 3, textAlign: "left" }}>
                  <Button
                    type="submit"
                    sx={{ "&[disabled]": { opacity: "0.2" } }}
                    disabled={
                      (("isPending" in createProjectResource && createProjectResource.isPending) ||
                        !validate(data).valid) &&
                      !("errorMessage" in createProjectResource)
                    }
                  >
                    Create map
                  </Button>
                </Box>
              </React.Fragment>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    regionConfigs: state.regionConfig.regionConfigs,
    organization: state.organization,
    user: state.user
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
