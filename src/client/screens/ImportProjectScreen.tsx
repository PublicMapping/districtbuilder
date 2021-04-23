/** @jsx jsx */
import { darken } from "@theme-ui/color";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileDrop } from "react-file-drop";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Spinner, ThemeUIStyleObject } from "theme-ui";

import { FIPS } from "../../shared/constants";
import { DistrictsDefinition, IProject, IRegionConfig } from "../../shared/entities";

import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject, importCsv } from "../api";
import { InputField } from "../components/Field";
import Icon from "../components/Icon";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";
import { State } from "../reducers";
import { WriteResource, Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly regionConfigs: Resource<readonly IRegionConfig[]>;
}

const validate = (form: ConfigurableForm, importResource: ImportResource): ProjectForm => {
  const regionConfig = importResource.data;
  const districtsDefinition = "resource" in importResource ? importResource.resource : null;
  const numberOfDistricts = form.numberOfDistricts;
  return numberOfDistricts && regionConfig && districtsDefinition
    ? { numberOfDistricts, regionConfig, districtsDefinition, valid: true }
    : { numberOfDistricts, regionConfig, districtsDefinition, valid: false };
};

type ImportResource = WriteResource<IRegionConfig | null, DistrictsDefinition>;

interface ConfigurableForm {
  readonly numberOfDistricts: number | null;
}

type ProjectForm = ValidForm | InvalidForm;

interface ValidForm {
  readonly regionConfig: IRegionConfig;
  readonly districtsDefinition: DistrictsDefinition;
  readonly numberOfDistricts: number;
  readonly valid: true;
}

interface InvalidForm {
  readonly regionConfig: IRegionConfig | null;
  readonly districtsDefinition: DistrictsDefinition | null;
  readonly numberOfDistricts: number | null;
  readonly valid: false;
}

const blankForm: ConfigurableForm = {
  numberOfDistricts: null
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
  }
};

async function getStateFromCsv(file: Blob): Promise<string | undefined> {
  const contents = await new Response(file).text();
  const [, record] = contents.split(/\r?\n/, 2);
  const stateFips = record && record.slice(0, 2);
  const stateAbbrev = stateFips && FIPS[stateFips];
  return stateAbbrev;
}

const ImportProjectScreen = ({ regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importNumberRef = useRef(0);
  const [importResource, setImportResource] = useState<ImportResource>({
    data: null
  });
  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ConfigurableForm, IProject>
  >({
    data: blankForm
  });
  const regionConfig = importResource.data;
  const formData = createProjectResource.data;

  const setFile = useCallback(
    (file: Blob) => {
      async function setConfigFromFile() {
        if (file && "resource" in regionConfigs) {
          const stateAbbrev = await getStateFromCsv(file);
          // eslint-disable-next-line
          importNumberRef.current = importNumberRef.current + 1;
          const importNumber = importNumberRef.current;

          const regionConfig =
            regionConfigs.resource.find(
              config =>
                !config.hidden && config.regionCode === stateAbbrev && config.countryCode === "US"
            ) || null;
          if (regionConfig) {
            setImportResource({ data: regionConfig, isPending: true });
            const districtsDefinition = await importCsv(file);
            // Don't set the districtsDefinition if upload was cancelled while we were fetching it
            if (importNumberRef.current === importNumber) {
              setImportResource({ data: regionConfig, resource: districtsDefinition });
            }
          } else {
            setImportResource({ data: null });
          }
        }
      }
      void setConfigFromFile();
    },
    [regionConfigs, importNumberRef]
  );

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : "resource" in regionConfigs ? (
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
              const validatedForm = validate(formData, importResource);
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data: formData, isPending: true });
                createProject({
                  ...validatedForm,
                  name: validatedForm.regionConfig.name
                })
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
              {regionConfig ? (
                <Box sx={style.uploadSuccess}>
                  {"resource" in importResource ? (
                    <b>Upload success</b>
                  ) : (
                    <span>
                      <Spinner variant="spinner.small" /> Uploading
                    </span>
                  )}
                  <Button
                    sx={{ variant: "buttons.linkStyle" }}
                    onClick={() => {
                      // eslint-disable-next-line
                      importNumberRef.current += 1;
                      if (fileInputRef.current) {
                        // eslint-disable-next-line
                        fileInputRef.current.value = "";
                      }
                      setImportResource({
                        data: null
                      });
                      setCreateProjectResource({ data: blankForm });
                    }}
                  >
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
                <Card sx={{ variant: "card.flat" }}>
                  <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                    Districts
                  </legend>
                  <fieldset sx={style.fieldset}>
                    <Flex>
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
                    </Flex>
                  </fieldset>
                </Card>
                <Box sx={{ mt: 3, textAlign: "left" }}>
                  <Button
                    type="submit"
                    disabled={
                      !validate(formData, importResource).valid &&
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
  ) : (
    <Box>Loading...</Box>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    regionConfigs: state.regionConfig.regionConfigs
  };
}

export default connect(mapStateToProps)(ImportProjectScreen);
