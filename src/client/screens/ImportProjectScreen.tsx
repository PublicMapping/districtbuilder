/** @jsx jsx */
import { darken } from "@theme-ui/color";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileDrop } from "react-file-drop";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

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

const validate = (form: ProjectForm) =>
  form.numberOfDistricts !== null && form.regionConfig !== null && form.districtsDefinition !== null
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface ProjectForm {
  readonly regionConfig: IRegionConfig | null;
  readonly districtsDefinition: DistrictsDefinition | null;
  readonly numberOfDistricts: number | null;
}

interface ValidForm {
  readonly regionConfig: IRegionConfig;
  readonly districtsDefinition: DistrictsDefinition;
  readonly numberOfDistricts: number;
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
  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<ProjectForm, IProject>
  >({
    data: {
      regionConfig: null,
      districtsDefinition: null,
      numberOfDistricts: null
    }
  });
  const { data } = createProjectResource;

  const setFile = useCallback(
    (file: Blob) => {
      async function setConfigFromFile() {
        if (file && "resource" in regionConfigs) {
          const stateAbbrev = await getStateFromCsv(file);
          const regionConfig =
            regionConfigs.resource.find(config => config.regionCode === stateAbbrev) || null;
          const dataWithRegion = { ...data, regionConfig };
          setCreateProjectResource({ data: dataWithRegion });
          const districtsDefinition = await importCsv(file);
          setCreateProjectResource({ data: { ...dataWithRegion, districtsDefinition } });
        }
      }
      void setConfigFromFile();
    },
    [data, regionConfigs]
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
              const validatedForm = validate(data);
              if (validatedForm.valid === true) {
                setCreateProjectResource({ data, isPending: true });
                createProject({
                  ...validatedForm,
                  name: validatedForm.regionConfig.name
                })
                  .then((project: IProject) =>
                    setCreateProjectResource({ data, resource: project })
                  )
                  .catch(errors => setCreateProjectResource({ data, errors }));
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
              {data.regionConfig ? (
                <Box sx={style.uploadSuccess}>
                  <b>Upload successful!</b>
                  <Button
                    sx={{ variant: "buttons.linkStyle" }}
                    onClick={() => {
                      setCreateProjectResource({
                        data: {
                          regionConfig: null,
                          districtsDefinition: null,
                          numberOfDistricts: null
                        }
                      });
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
            {data.regionConfig && (
              <React.Fragment>
                <Card sx={{ variant: "card.flat" }}>
                  <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                    State
                  </legend>
                  We detected block data for <b>{data.regionConfig.name}</b>. To pick a different
                  state, upload a new file.
                </Card>
                <Card sx={{ variant: "card.flat" }}>
                  <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
                    Distrcts
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
                                  ...data,
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
