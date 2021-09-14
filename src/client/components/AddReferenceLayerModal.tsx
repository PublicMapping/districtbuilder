/** @jsx jsx */
import { darken } from "@theme-ui/color";
import React, { useState, useCallback, useRef, useEffect } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { InputField } from "../components/Field";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject, Label, Select } from "theme-ui";

import { IProject, ProjectId } from "../../shared/entities";
import { createReferenceLayer } from "../api";
import { convertCsvToGeojson, showActionFailedToast } from "../functions";
import { State } from "../reducers";
import store from "../store";
import { ReferenceLayerGeojson, ReferenceLayerWithGeojson } from "../types";
import { projectReferenceLayersFetch, toggleReferenceLayersModal } from "../actions/projectData";
import { FileDrop } from "react-file-drop";
import { WriteResource } from "../resource";
import { MAX_UPLOAD_FILE_SIZE, ReferenceLayerTypes } from "../../shared/constants";
import { readString } from "react-papaparse";
import Icon from "./Icon";

const style: ThemeUIStyleObject = {
  footer: {
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
  customInputContainer: {
    width: "100%"
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

const validate = (form: ConfigurableForm): ReferenceLayerForm => {
  const layer = form.layer;
  const name = form.name;
  const project = form.project;
  const label_field = form.label_field;
  const layer_type = form.layer_type;
  const fields = form.fields;
  const numberOfFeatures = layer && layer.features ? layer.features.length : 0;

  return numberOfFeatures > 0 && layer && name && layer_type && fields
    ? {
        numberOfFeatures,
        name,
        project,
        layer_type,
        layer,
        fields,
        label_field: label_field || undefined,
        valid: true
      }
    : {
        numberOfFeatures,
        name,
        project,
        label_field,
        layer_type,
        layer,
        fields,
        valid: false
      };
};

type ReferenceLayerForm = ValidForm | InvalidForm;

interface ValidForm {
  readonly name: string;
  readonly project: ProjectId;
  readonly layer: ReferenceLayerGeojson;
  readonly numberOfFeatures: number;
  readonly label_field?: string;
  readonly fields: readonly string[];
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
  readonly fields: readonly string[] | null;
  readonly valid: false;
}

interface ConfigurableForm {
  readonly name: string | null;
  readonly label_field: string | null;
  readonly project: ProjectId;
  readonly layer: ReferenceLayerGeojson | null;
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon | null;
  readonly fields: readonly string[] | null;
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

  const blankForm: ConfigurableForm = {
    name: null,
    label_field: null,
    project: project.id,
    layer: null,
    layer_type: null,
    fields: null,
    numberOfFeatures: null
  };

  const [createLayerResource, setCreateLayerResource] = useState<
    WriteResource<ConfigurableForm, ReferenceLayerWithGeojson>
  >({
    data: blankForm
  });
  const formData = createLayerResource.data;

  async function checkCsvContainsValidPoints(file: Blob): Promise<boolean> {
    const contents = await new Response(file).text();
    const lines = contents.split("\n");
    if (lines.length > 0) {
      const header = lines[0]
        .replace("\r", "")
        .split(",")
        .map(s => s.toLowerCase());
      if (
        (header.includes("lat") || header.includes("latitude") || header.includes("y")) &&
        (header.includes("lon") ||
          header.includes("long") ||
          header.includes("longitude") ||
          header.includes("x"))
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

  function resetForm() {
    setFileError(undefined);
    setCreateLayerResource({ data: blankForm });
  }

  function setGeoJSON(geojson: ReferenceLayerGeojson) {
    const layerType =
      geojson.features[0]?.geometry?.type === "Point"
        ? ReferenceLayerTypes.Point
        : geojson.features[0]?.geometry?.type === "Polygon" ||
          geojson.features[0]?.geometry?.type === "MultiPolygon"
        ? ReferenceLayerTypes.Polygon
        : undefined;
    !layerType && setFileError("Geojson must be point or polygon");
    layerType &&
      setCreateLayerResource({
        data: {
          ...createLayerResource.data,
          layer_type: layerType,
          layer: geojson,
          numberOfFeatures: geojson.features.length,
          fields: Object.keys(geojson.features[0].properties) || null
        }
      });
  }

  function onReaderLoadCsv(event: ProgressEvent<FileReader>) {
    const csvText = event.target?.result && event.target.result.toString();
    const results =
      csvText &&
      readString(csvText, { header: true, transformHeader: (s: string) => s.toLowerCase() });
    const geojson = results && convertCsvToGeojson(results);
    geojson && setGeoJSON(geojson);
  }

  function onReaderLoadGeoJson(event: ProgressEvent<FileReader>) {
    const geojson = event.target?.result && JSON.parse(event.target?.result.toString());
    geojson && setGeoJSON(geojson);
  }

  function parseFile(file: File, extension: string) {
    // const contents = await new Response(file).text();
    const reader = new FileReader();
    /* eslint-disable functional/immutable-data */
    reader.onload = extension === "geojson" ? onReaderLoadGeoJson : onReaderLoadCsv;
    reader.readAsText(file);
  }

  const setFile = useCallback((file: File) => {
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

        parseFile(file, extension);
      }
    }
    void setConfigFromFile();
  }, []);

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
              const validatedForm = validate(formData);
              if (validatedForm.valid === true) {
                setCreateLayerResource({ data: formData, isPending: true });
                const referenceLayer = {
                  name: validatedForm.name,
                  label_field: validatedForm.label_field,
                  project: validatedForm.project,
                  layer: validatedForm.layer,
                  layer_type: validatedForm.layer_type
                };

                createReferenceLayer(referenceLayer)
                  .then((refLayer: ReferenceLayerWithGeojson) => {
                    setCreateLayerResource({ resource: refLayer, data: formData });
                    store.dispatch(projectReferenceLayersFetch(project.id));
                  })
                  .catch(showActionFailedToast);
              }
            }}
          >
            {formData.layer && formData.layer_type ? (
              <Box>
                <Box sx={{ mb: 3 }}>
                  Upload successful with {formData.numberOfFeatures}{" "}
                  {formData.layer_type.toLowerCase()}s. Give your layer a name and choose which
                  property to use for labels.
                </Box>
                <Flex sx={{ flexWrap: "wrap" }}>
                  <Box sx={style.customInputContainer}>
                    <InputField
                      field="name"
                      label="Layer name"
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
                <Flex sx={{ flexWrap: "wrap" }}>
                  <Box sx={style.customInputContainer}>
                    <Label
                      htmlFor="label-field-dropdown"
                      sx={{ display: "inline-block", width: "auto", mb: 0, mr: 2 }}
                    >
                      Label property:
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
                      sx={{ width: "100%" }}
                    >
                      <option>Select label property...</option>
                      {labelOptions}
                    </Select>
                  </Box>
                </Flex>
              </Box>
            ) : fileError ? (
              <Box sx={style.uploadError}>
                <b>Error: {fileError}</b>
                <Button sx={{ variant: "buttons.linkStyle" }} onClick={() => resetForm()}>
                  <Icon name="undo" />
                  Redo
                </Button>
              </Box>
            ) : (
              <Box>
                <input
                  onChange={event => event.target.files && setFile(event.target.files[0])}
                  ref={fileInputRef}
                  type="file"
                  accept={".csv,.geojson"}
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
                  <Flex sx={{ p: 2, minHeight: "150px" }}>
                    <Box sx={{ m: "auto" }}>
                      Drag and drop CSV / geojson file or{" "}
                      <Button type="button" id="primary-action">
                        Browse files
                      </Button>
                    </Box>
                  </Flex>
                </FileDrop>
              </Box>
            )}

            <Flex sx={style.footer}>
              {formData.layer && (
                <React.Fragment>
                  <Button
                    id="primary-action"
                    type="submit"
                    disabled={
                      !validate(formData).valid ||
                      ("isPending" in createLayerResource && createLayerResource.isPending)
                    }
                  >
                    Add to map
                  </Button>
                  <Button sx={{ ml: 2, variant: "buttons.subtle" }} onClick={() => resetForm()}>
                    Back
                  </Button>
                </React.Fragment>
              )}
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
