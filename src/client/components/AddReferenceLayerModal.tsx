/** @jsx jsx */
import { darken } from "@theme-ui/color";
import React, { useState, useCallback, useRef, useEffect } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { InputField } from "../components/Field";
import {
  Box,
  Button,
  Flex,
  Heading,
  jsx,
  ThemeUIStyleObject,
  Spinner,
  Label,
  Select,
  Card
} from "theme-ui";

import { IProject, ProjectId } from "../../shared/entities";
import { createReferenceLayer, importReferenceLayerCsv, importReferenceLayerGeojson } from "../api";
import { showActionFailedToast } from "../functions";
import { State } from "../reducers";
import store from "../store";
import { ReferenceLayerGeojson, ReferenceLayerWithGeojson } from "../types";
import { projectReferenceLayersFetch, toggleReferenceLayersModal } from "../actions/projectData";
import { FileDrop } from "react-file-drop";
import { WriteResource } from "../resource";
import { MAX_UPLOAD_FILE_SIZE, ReferenceLayerTypes } from "../../shared/constants";
import Icon from "./Icon";

const style: ThemeUIStyleObject = {
  footer: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5
  },
  header: {
    mb: 5
  },
  heading: {
    fontFamily: "heading",
    fontWeight: "light",
    fontSize: 4
  },
  modal: {
    bg: "muted",
    p: 5,
    width: "small",
    maxWidth: "90vw",
    overflow: "visible"
  },
  uploadSuccess: {
    bg: "success.0",
    border: "2px solid",
    borderColor: "success.4",
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
  }
};

type ImportLayerResource = WriteResource<ProjectId, ReferenceLayerGeojson>;

const validate = (
  form: ConfigurableForm,
  importResource: ImportLayerResource
): ReferenceLayerForm => {
  const layer = "resource" in importResource ? importResource.resource : null;
  const name = form.name;
  const project = form.project;
  const label_field = form.label_field;
  const layer_type = form.layer_type;
  const numberOfFeatures = layer && layer.features ? layer.features.length : 0;

  return numberOfFeatures > 0 && layer && name && label_field && layer_type
    ? {
        numberOfFeatures,
        name,
        project,
        label_field,
        layer_type,
        layer,
        valid: true
      }
    : {
        numberOfFeatures,
        name,
        project,
        label_field,
        layer_type,
        layer,
        valid: false
      };
};

type ReferenceLayerForm = ValidForm | InvalidForm;

interface ValidForm {
  readonly name: string;
  readonly project: ProjectId;
  readonly layer: ReferenceLayerGeojson;
  readonly numberOfFeatures: number;
  readonly label_field: string;
  readonly fields?: readonly string[];
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon;
  readonly valid: true;
}

interface InvalidForm {
  readonly name: string | null;
  readonly project: ProjectId | null;
  readonly layer: ReferenceLayerGeojson | null;
  readonly numberOfFeatures: number;
  readonly label_field: string | null;
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon | null;
  readonly fields?: readonly string[] | null;
  readonly valid: false;
}

interface ConfigurableForm {
  readonly name: string | null;
  readonly label_field: string | null;
  readonly project: ProjectId;
  readonly layer: ReferenceLayerGeojson | null;
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon | null;
  readonly fields?: readonly string[] | null;
  readonly numberOfFeatures: number | null;
}

const AddReferenceLayerModal = ({
  project,
  showModal
}: {
  readonly project: IProject;
  readonly showModal: boolean;
}) => {
  const hideModal = () => store.dispatch(toggleReferenceLayersModal()) && resetForm();
  const [fileError, setFileError] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importNumberRef = useRef(0);

  async function checkCsvContainsValidPoints(file: Blob): Promise<boolean> {
    const contents = await new Response(file).text();
    const lines = contents.split("\n");
    if (lines.length > 0) {
      const header = lines[0].replace("\r", "").split(",");
      if (
        (header.includes("lat") || header.includes("latitude")) &&
        (header.includes("lon") || header.includes("long") || header.includes("longitude"))
      ) {
        return true;
      } else {
        setFileError("CSV must include latitude and longitude");
        return false;
      }
    } else {
      setFileError("CSV must include at least one record");
      return false;
    }
  }

  const blankForm: ConfigurableForm = {
    name: null,
    label_field: null,
    project: project.id,
    layer: null,
    layer_type: null,
    numberOfFeatures: null
  };

  const [importResource, setImportResource] = useState<
    WriteResource<ProjectId, ReferenceLayerGeojson>
  >({
    data: project.id
  });

  const [createLayerResource, setCreateLayerResource] = useState<
    WriteResource<ConfigurableForm, ReferenceLayerWithGeojson>
  >({
    data: blankForm
  });
  const formData = createLayerResource.data;

  function resetForm() {
    setImportResource({
      data: project.id
    });
    setFileError(undefined);
    setCreateLayerResource({ data: blankForm });
  }

  const setFile = useCallback(
    (file: File) => {
      async function setConfigFromFile() {
        if (file) {
          // Check file size (must be less than MaxUploadFileSize)
          if (file.size > MAX_UPLOAD_FILE_SIZE) {
            setFileError("File must be less than 25mb");
            return;
          }

          const extension = file.name.split(".")[1];

          if (extension !== "csv" && extension !== "geojson") {
            setFileError("File must be a .csv or .geojson file");
            return;
          }
          if (extension === "csv") {
            const csvValid = await checkCsvContainsValidPoints(file);
            if (!csvValid) {
              return;
            }
          }

          const importResponse =
            extension === "csv"
              ? await importReferenceLayerCsv(file)
              : await importReferenceLayerGeojson(file);
          const layerType =
            extension === "csv"
              ? ReferenceLayerTypes.Point
              : importResponse?.features[0]?.geometry?.type === "Point"
              ? ReferenceLayerTypes.Point
              : importResponse?.features[0]?.geometry?.type === "Polygon"
              ? ReferenceLayerTypes.Polygon
              : undefined;
          !layerType && setFileError("Geojson must be point or polygon");
          layerType &&
            setCreateLayerResource({
              data: { ...createLayerResource.data, layer_type: layerType }
            });
          layerType && setImportResource({ ...importResource, resource: importResponse });
        }
      }
      void setConfigFromFile();
    },
    [importNumberRef]
  );

  useEffect(() => {
    "resource" in importResource &&
      importResource.resource &&
      !createLayerResource.data.numberOfFeatures &&
      setCreateLayerResource({
        data: {
          ...createLayerResource.data,
          numberOfFeatures: importResource.resource.features.length,
          fields: Object.keys(importResource.resource.features[0].properties) || null
        }
      });
  }, [importResource]);

  useEffect(() => {
    if ("resource" in createLayerResource && createLayerResource.resource) {
      hideModal();
    }
  }, [createLayerResource]);

  const labelOptions = createLayerResource.data.fields
    ? createLayerResource.data.fields.map(val => (
        <option key={val} value={val}>
          {val}
        </option>
      ))
    : [];

  return showModal ? (
    <AriaModal
      titleId="add-reference-layer-modal"
      onExit={hideModal}
      initialFocus="#primary-action"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <React.Fragment>
          <Box sx={style.header}>
            <Heading as="h1" sx={style.heading} id="add-reference-layer-modal-header">
              Add reference layer
            </Heading>
          </Box>
          <Flex
            as="form"
            sx={{ flexDirection: "column" }}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const validatedForm = validate(formData, importResource);
              if (validatedForm.valid === true) {
                setCreateLayerResource({ data: validatedForm, isPending: true });
                //eslint-disable-next-line
                const referenceLayer = {
                  name: validatedForm.name,
                  label_field: validatedForm.label_field,
                  project: validatedForm.project,
                  layer: validatedForm.layer,
                  layer_type: validatedForm.layer_type
                };

                createReferenceLayer(referenceLayer)
                  .then((refLayer: ReferenceLayerWithGeojson) => {
                    setCreateLayerResource({ resource: refLayer, data: validatedForm });
                    store.dispatch(projectReferenceLayersFetch(project.id));
                  })
                  .catch(showActionFailedToast);
              }
            }}
          >
            {"isPending" in importResource && importResource.isPending ? (
              <span>
                <Spinner variant="spinner.small" /> Uploading
              </span>
            ) : "resource" in importResource || fileError ? (
              <Box>
                {fileError ? (
                  <Box sx={style.uploadError}>
                    <b>Error: {fileError}</b>
                  </Box>
                ) : "resource" in importResource ? (
                  <Box>
                    <Box sx={style.uploadSuccess}>
                      <b>Upload success</b>
                    </Box>
                    <Flex>Number of features: {createLayerResource.data.numberOfFeatures}</Flex>
                    <Flex>Layer type: {createLayerResource.data.layer_type}</Flex>
                    <Card sx={{ variant: "card.flat" }}>
                      <Flex sx={{ flexWrap: "wrap" }}>
                        <Box sx={style.customInputContainer}>
                          <InputField
                            field="name"
                            label="Reference layer name"
                            resource={createLayerResource}
                            inputProps={{
                              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                const name = e.currentTarget.value;
                                name !== null &&
                                  setCreateLayerResource({
                                    data: {
                                      ...formData,
                                      name
                                    }
                                  });
                              }
                            }}
                          />
                        </Box>
                      </Flex>
                    </Card>
                    <Card sx={{ variant: "card.flat" }}>
                      <Flex sx={{ flexWrap: "wrap" }}>
                        <Box sx={style.customInputContainer}>
                          <Label
                            htmlFor="label-field-dropdown"
                            sx={{ display: "inline-block", width: "auto", mb: 0, mr: 2 }}
                          >
                            Label field:
                          </Label>
                          <Select
                            id="label-field-dropdown"
                            value={createLayerResource.data.label_field || "Select label field..."}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              const label = e.currentTarget.value;
                              setCreateLayerResource({
                                data: { ...createLayerResource.data, label_field: label }
                              });
                            }}
                            sx={{ width: "150px" }}
                          >
                            <option>Select label field...</option>
                            {labelOptions}
                          </Select>
                        </Box>
                      </Flex>
                    </Card>
                  </Box>
                ) : (
                  <Box></Box>
                )}
                <Button sx={{ variant: "buttons.linkStyle" }} onClick={() => resetForm()}>
                  <Icon name="undo" />
                  Redo
                </Button>
              </Box>
            ) : (
              <Box>
                <Box>This will add a reference layer to your project.</Box>
                <input
                  onChange={event => event.target.files && setFile(event.target.files[0])}
                  ref={fileInputRef}
                  type="file"
                  // accept={".csv" || ".geojson"}
                  style={{ display: "none" }}
                />
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
                      Drag and drop CSV / geojson file or{" "}
                      <Button type="button">Browse files</Button>
                    </Box>
                  </Flex>
                </FileDrop>
              </Box>
            )}

            <Flex sx={style.footer}>
              {"resource" in importResource && (
                <Button
                  id="primary-action"
                  sx={{ marginBottom: 3 }}
                  type="submit"
                  disabled={
                    !validate(formData, importResource).valid &&
                    !("errorMessage" in createLayerResource)
                  }
                >
                  Yes, add reference layer
                </Button>
              )}
              <Button
                id="cancel-add-reference-layer"
                onClick={hideModal}
                sx={{ variant: "buttons.linkStyle", margin: "0 auto" }}
              >
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
    showModal: state.project.showReferenceLayersModal
  };
}

export default connect(mapStateToProps)(AddReferenceLayerModal);
