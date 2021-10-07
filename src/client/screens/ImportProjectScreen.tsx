/** @jsx jsx */
import { darken } from "@theme-ui/color";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileDrop } from "react-file-drop";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  jsx,
  Spinner,
  ThemeUIStyleObject,
  Label,
  Radio
} from "theme-ui";

import { DEFAULT_POPULATION_DEVIATION, FIPS, MAX_UPLOAD_FILE_SIZE } from "../../shared/constants";
import {
  DistrictsDefinition,
  IProject,
  IRegionConfig,
  IChamber,
  DistrictsImportApiSuccess,
  IOrganization,
  IUser,
  CreateProjectData,
  OrganizationNest
} from "../../shared/entities";

import { regionConfigsFetch } from "../actions/regionConfig";
import { setImportFlagsModal } from "../actions/districtDrawing";

import { createProject, importCsv } from "../api";
import { InputField } from "../components/Field";
import Icon from "../components/Icon";
import ImportFlagsModal from "../components/ImportFlagsModal";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";
import { State } from "../reducers";
import { WriteResource, Resource } from "../resource";
import store from "../store";
import OrganizationTemplateForm from "../components/OrganizationTemplateForm";
import { userFetch } from "../actions/user";
import { destructureResource } from "../functions";

interface StateProps {
  readonly organization: Resource<IOrganization>;
  readonly regionConfigs: Resource<readonly IRegionConfig[]>;
  readonly user: Resource<IUser>;
}

const validate = (
  form: ConfigurableForm,
  importResource: ImportResource,
  templateData: CreateProjectData | null,
  organization: Resource<IOrganization>
): ProjectForm => {
  const regionConfig = importResource.data;
  const districtsDefinition =
    "resource" in importResource ? importResource.resource.districtsDefinition : null;
  const maxDistrictId = "resource" in importResource ? importResource.resource.maxDistrictId : null;
  const numberOfDistricts = form.numberOfDistricts;
  const populationDeviation = form.populationDeviation;
  const chamber = form.chamber;
  const isCustom = form.isCustom;
  const organizationSelected = "resource" in organization;

  return organizationSelected && templateData?.projectTemplate && districtsDefinition
    ? // Valid for the selected template
      {
        projectTemplate: templateData.projectTemplate,
        regionConfig: templateData.regionConfig,
        districtsDefinition,
        isCustom,
        valid: true
      }
    : !organizationSelected &&
      numberOfDistricts &&
      maxDistrictId &&
      regionConfig &&
      populationDeviation !== null &&
      districtsDefinition &&
      numberOfDistricts >= maxDistrictId
    ? // Valid for the standard RegionConfig for this CSV
      {
        numberOfDistricts,
        regionConfig,
        districtsDefinition,
        chamber,
        isCustom,
        populationDeviation,
        valid: true
      }
    : // Invalid
      {
        numberOfDistricts,
        regionConfig,
        districtsDefinition,
        chamber,
        isCustom,
        populationDeviation,
        valid: false
      };
};

type ImportResource = WriteResource<IRegionConfig | null, DistrictsImportApiSuccess>;

interface ConfigurableForm {
  readonly numberOfDistricts: number | null;
  readonly isCustom: boolean;
  readonly chamber: IChamber | null;
  readonly populationDeviation: number;
}

type ProjectForm = ValidForm | InvalidForm;

interface ValidCustomForm {
  readonly regionConfig: IRegionConfig;
  readonly chamber: Pick<IChamber, "id"> | null;
  readonly districtsDefinition: DistrictsDefinition;
  readonly numberOfDistricts: number;
  readonly isCustom: boolean;
  readonly populationDeviation: number;
  readonly valid: true;
}

interface ValidTemplateForm {
  readonly districtsDefinition: DistrictsDefinition;
  readonly regionConfig: Pick<IRegionConfig, "id">;
  readonly projectTemplate: Pick<IRegionConfig, "id">;
  readonly isCustom: boolean;
  readonly valid: true;
}

type ValidForm = ValidCustomForm | ValidTemplateForm;

interface InvalidForm {
  readonly regionConfig: IRegionConfig | null;
  readonly chamber: Pick<IChamber, "id"> | null;
  readonly districtsDefinition: DistrictsDefinition | null;
  readonly numberOfDistricts: number | null;
  readonly isCustom: boolean;
  readonly populationDeviation: number | null;
  readonly valid: false;
}

const blankForm: ConfigurableForm = {
  numberOfDistricts: null,
  isCustom: true,
  chamber: null,
  populationDeviation: DEFAULT_POPULATION_DEVIATION
};

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
    maxWidth: "medium",
    my: 7,
    mx: "auto",
    flexDirection: "column",
    "@media screen and (max-width: 770px)": {
      width: "95%",
      my: 2
    }
  },
  cardLabel: {
    textTransform: "none",
    variant: "text.h4",
    display: "block",
    mb: 1
  },
  cardHint: {
    display: "block",
    textTransform: "none",
    fontWeight: "normal",
    fontSize: 1,
    mb: 4
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
  fileTarget: {
    ".file-drop-target": {
      border: "2px dashed",
      borderColor: "gray.2",
      cursor: "pointer",
      "&:hover button": {
        bg: darken("primary", 0.1)
      },
      "&.file-drop-dragging-over-frame": {
        borderColor: "gray.4",
        bg: "gray.0"
      },
      "&.file-drop-dragging-over-target": {
        borderColor: "success.4",
        bg: "success.0"
      }
    }
  },
  uploadSuccess: {
    bg: "success.0",
    border: "2px solid",
    borderColor: "success.4",
    display: "flex",
    justifyContent: "space-between",
    p: 4
  },
  uploadSuccessWithFlags: {
    bg: "warning",
    opacity: "0.9",
    border: "2px solid",
    borderColor: "warning",
    display: "flex",
    justifyContent: "space-between",
    p: 4
  },
  uploadError: {
    bg: "error",
    opacity: "0.9",
    border: "2px solid",
    borderColor: "error",
    display: "flex",
    justifyContent: "space-between",
    p: 4
  },
  rowFlagsLink: {
    textDecoration: "underline",
    cursor: "pointer"
  }
};

async function getStateFromCsv(file: Blob): Promise<string | undefined> {
  const contents = await new Response(file).text();
  const [, record] = contents.split(/\r?\n/, 2);
  const stateFips = record && record.slice(0, 2);
  const stateAbbrev = stateFips && FIPS[stateFips];
  return stateAbbrev;
}

function filterProjectTemplates<O extends OrganizationNest | IOrganization>(
  org: O,
  stateAbbrev: string
) {
  const projectTemplates = org.projectTemplates.filter(
    template => template.regionConfig.regionCode === stateAbbrev
  );
  return projectTemplates.length > 0 ? { ...org, projectTemplates } : undefined;
}

const ImportProjectScreen = ({ organization, regionConfigs, user }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
    store.dispatch(userFetch());
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importNumberRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [stateAbbrev, setStateAbbrev] = useState<string | null>(null);
  const [importResource, setImportResource] = useState<ImportResource>({
    data: null
  });
  const [templateData, setTemplateData] = useState<CreateProjectData | null>(null);
  const rowFlags = "resource" in importResource && importResource.resource.rowFlags;
  const maxDistrictId = "resource" in importResource && importResource.resource.maxDistrictId;
  const numFlags = "resource" in importResource && importResource.resource.numFlags;

  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ConfigurableForm, IProject>
  >({
    data: blankForm
  });
  const [fileError, setFileError] = useState<string | undefined>();
  const regionConfig = importResource.data;
  const formData = createProjectResource.data;

  const [organizationsForImport, setOrganizationsForImport] = useState<readonly IOrganization[]>(
    []
  );

  const onDistrictChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chamber =
      regionConfig !== null
        ? regionConfig.chambers.find(chamber => chamber.id === e.currentTarget.value)
        : null;
    setCreateProjectResource({
      data: {
        ...formData,
        ...(chamber
          ? {
              numberOfDistricts: chamber.numberOfDistricts,
              chamber: chamber || null,
              isCustom: false
            }
          : { numberOfDistricts: null, isCustom: true, chamber: null })
      }
    });
  };

  const onTemplateSelected = (data: CreateProjectData): Promise<void> => {
    setTemplateData(data);
    return Promise.resolve(void 0);
  };

  const handleFileUpload = useCallback(() => {
    async function setConfigFromFile() {
      if (file && "resource" in regionConfigs) {
        // Check file size (must be less than MAX_UPLOAD_FILE_SIZE)
        if (file.size > MAX_UPLOAD_FILE_SIZE) {
          setFileError("File must be less than 25mb");
          return;
        }

        const extension = file.name.split(".")[1];

        if (extension !== "csv") {
          setFileError("File must be a .csv");
          return;
        }

        // Check file is not empty
        const stateAbbrev = await getStateFromCsv(file);
        if (!stateAbbrev) {
          setFileError("File must have at least one record");
        }

        setStateAbbrev(stateAbbrev || null);

        // Filter to organizations and templates that match the state FIPS code
        const organizations = destructureResource(user, "organizations") || [];
        stateAbbrev &&
          setOrganizationsForImport(
            organizations
              .map((o: IOrganization) => filterProjectTemplates(o, stateAbbrev))
              .filter((org: IOrganization | undefined) => org !== undefined)
          );

        const regionConfig =
          regionConfigs.resource.find(
            config =>
              !config.hidden &&
              !config.archived &&
              config.regionCode === stateAbbrev &&
              config.countryCode === "US"
          ) || null;

        if (!regionConfig) {
          setImportResource({ data: null });
          setFileError(`State ${stateAbbrev} not currently supported`);
        }

        // eslint-disable-next-line
        importNumberRef.current = importNumberRef.current + 1;
        const importNumber = importNumberRef.current;
        setImportResource({ data: regionConfig, isPending: true });
        const regionConfigId = templateData?.regionConfig.id || regionConfig?.id;
        const importResponse = await importCsv(file, regionConfigId);

        // Don't set the districtsDefinition if upload was cancelled while we were fetching it
        if (importNumberRef.current === importNumber) {
          if ("error" in importResponse) {
            setImportResource({ data: null });
            setFileError(importResponse.error);
          } else {
            setImportResource({
              data: regionConfig,
              resource: importResponse
            });
          }
        }
      }
    }
    void setConfigFromFile();
  }, [regionConfigs, importNumberRef, user, file, templateData]);

  useEffect(() => {
    // If thre is no organization, clear template data
    if (!("resource" in organization) && "isPending" in organization && !organization.isPending) {
      setTemplateData(null);
    }
  }, [organization]);

  useEffect(() => {
    handleFileUpload();
  }, [file, templateData]);

  useEffect(() => {
    // Set error if number of districts less than max district ID
    if (
      formData.numberOfDistricts !== null &&
      maxDistrictId !== undefined &&
      formData.numberOfDistricts < maxDistrictId
    ) {
      setCreateProjectResource({
        data: formData,
        errors: {
          error: "Invalid number of districts",
          message: {
            numberOfDistricts: [
              `Number of districts must be at least the maximum district ID in the CSV, ${maxDistrictId} `
            ]
          }
        }
      });
    }
  }, [formData, maxDistrictId]);

  function resetForm() {
    // eslint-disable-next-line
    importNumberRef.current += 1;
    if (fileInputRef.current) {
      // eslint-disable-next-line
      fileInputRef.current.value = "";
    }
    setImportResource({
      data: null
    });
    setImportFlagsModal(false);
    setFileError(undefined);
    setCreateProjectResource({ data: blankForm });
  }

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : "resource" in regionConfigs && "resource" in user ? (
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
            <Logo sx={{ width: "2rem" }} />
          </Link>
        </Box>
        <Heading as="h2" sx={{ variant: "text.h4", color: "blue.0", my: 0 }}>
          New Map
        </Heading>
      </Flex>
      <Flex as="main" sx={{ width: "100%" }}>
        <Flex sx={style.formContainer}>
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(formData, importResource, templateData, organization);
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data: formData, isPending: true });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { isCustom, valid, ...validatedData } = validatedForm;
                createProject(
                  "name" in validatedForm.regionConfig
                    ? {
                        ...validatedData,
                        name: validatedForm.regionConfig.name
                      }
                    : validatedData
                )
                  .then((project: IProject) =>
                    setCreateProjectResource({ data: formData, resource: project })
                  )
                  .catch(errors => setCreateProjectResource({ data: formData, errors }));
              }
            }}
          >
            <Card sx={{ variant: "card.flat" }}>
              <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                Upload file
              </legend>
              <Box
                id="description-upload"
                as="span"
                sx={{ ...style.cardHint, ...{ flex: "0 0 100%" } }}
              >
                Select a block equivalency file CSV from DistrictBuilder or a different
                redistricting source.
              </Box>
              <input
                onChange={event => event.target.files && setFile(event.target.files[0])}
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
              />
              {regionConfig || fileError ? (
                <Box
                  sx={
                    !rowFlags && !fileError
                      ? style.uploadSuccess
                      : fileError
                      ? style.uploadError
                      : style.uploadSuccessWithFlags
                  }
                >
                  {"resource" in importResource && !numFlags && !fileError ? (
                    <b>Upload success</b>
                  ) : "resource" in importResource && numFlags ? (
                    <b>
                      Upload success, with
                      <span
                        sx={style.rowFlagsLink}
                        onClick={() => rowFlags && store.dispatch(setImportFlagsModal(true))}
                      >
                        &nbsp;{numFlags} flags
                      </span>
                    </b>
                  ) : fileError ? (
                    <b>Error: {fileError}</b>
                  ) : (
                    <span>
                      <Spinner variant="spinner.small" /> Uploading
                    </span>
                  )}
                  <Button sx={{ variant: "buttons.linkStyle" }} onClick={() => resetForm()}>
                    <Icon name="undo" />
                    Redo
                  </Button>
                </Box>
              ) : (
                <FileDrop
                  dropEffect="copy"
                  onDrop={files => files && setFile(files[0])}
                  onTargetClick={() => {
                    fileInputRef.current && fileInputRef.current.click();
                  }}
                  sx={style.fileTarget}
                >
                  {/* Clicking anywhere in this element triggers the FileDrop click handler, the <Button> is for show */}
                  <Flex sx={{ p: 2 }}>
                    <Box sx={{ m: "auto" }}>
                      Drag and drop CSV file or <Button type="button">Browse files</Button>
                    </Box>
                  </Flex>
                </FileDrop>
              )}
            </Card>
            {regionConfig && (
              <React.Fragment>
                <Card sx={{ variant: "card.flat" }}>
                  <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                    State
                  </legend>
                  We detected block data for <b>{regionConfig.name}</b>. To pick a different state,
                  upload a new file.
                </Card>
                {organizationsForImport && (
                  <OrganizationTemplateForm
                    organization={
                      "resource" in organization && stateAbbrev
                        ? filterProjectTemplates(organization.resource, stateAbbrev)
                        : undefined
                    }
                    organizations={organizationsForImport}
                    user={user.resource}
                    templateSelected={onTemplateSelected}
                  />
                )}
                {!(
                  "resource" in organization ||
                  ("isPending" in organization && organization.isPending)
                ) && (
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
                          {regionConfig &&
                            [...regionConfig.chambers]
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
                          {formData.isCustom ? (
                            <Box sx={style.customInputContainer}>
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
                                        ...formData,
                                        numberOfDistricts
                                      }
                                    });
                                  }
                                }}
                              />
                            </Box>
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
                                populationDeviation !== null &&
                                  setCreateProjectResource({
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
                    </Card>
                  </React.Fragment>
                )}
                <Box sx={{ mt: 3, textAlign: "left" }}>
                  <Button
                    type="submit"
                    disabled={
                      ("isPending" in createProjectResource && createProjectResource.isPending) ||
                      (!validate(formData, importResource, templateData, organization).valid &&
                        !("errorMessage" in createProjectResource))
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
      {rowFlags && (
        <ImportFlagsModal
          importFlags={rowFlags}
          numFlags={numFlags || 0}
          onContinue={() => store.dispatch(setImportFlagsModal(false))}
          onCancel={() => resetForm()}
        ></ImportFlagsModal>
      )}
    </Flex>
  ) : (
    <Box>Loading...</Box>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    organization: state.organization,
    regionConfigs: state.regionConfig.regionConfigs,
    user: state.user
  };
}

export default connect(mapStateToProps)(ImportProjectScreen);
