/** @jsx jsx */
import { useState } from "react";
import { Button, Flex, Box, Heading, jsx, ThemeUIStyleObject, Checkbox, Label } from "theme-ui";

import { IReferenceLayer, ReferenceLayerId } from "../../shared/entities";
import Icon from "./Icon";

import store from "../store";
import { ReferenceLayerColors, ReferenceLayerTypes } from "../../shared/constants";
import { REFERENCE_LAYER_COLOR_CODES } from "../constants/colors";
import { toggleReferenceLayer } from "../actions/districtDrawing";
import { toggleReferenceLayersModal } from "../actions/projectData";
import ReferenceLayerFlyout from "./ReferenceLayerFlyout";

const style: Record<string, ThemeUIStyleObject> = {
  referenceHeader: {
    p: 2,
    display: "block",
    width: "100%",
    borderTop: "1px solid",
    borderTopColor: "gray.2"
  },
  referenceLayers: {
    position: "relative",
    width: "100%",
    bottom: "0px",
    display: "inline-block"
  },
  referenceLayerList: {
    flexDirection: "column",
    alignItems: "flex-start",
    p: 2,
    pt: 0
  },
  selectionButton: {
    variant: "buttons.outlined",
    fontSize: 1,
    position: "absolute",
    right: "10px",
    top: "0px",
    "&.selected": {
      bg: "blue.0",
      borderColor: "blue.2",
      borderBottom: "2px solid",
      borderBottomColor: "blue.5",
      color: "blue.8"
    }
  }
};

const ReferenceLayer = ({
  isReadOnly,
  layer,
  checked
}: {
  readonly isReadOnly: boolean;
  readonly layer: IReferenceLayer;
  readonly checked: boolean;
}) => (
  <Flex sx={{ alignItems: "center", pb: 1, width: "100%" }}>
    <Box sx={{ display: "inline" }}>
      <Label sx={{ m: "auto" }}>
        <Checkbox
          sx={{ height: "20px" }}
          checked={checked}
          onChange={() => {
            store.dispatch(toggleReferenceLayer({ id: layer.id, show: !checked }));
          }}
        />
      </Label>
    </Box>
    <Icon
      name={layer.layer_type === ReferenceLayerTypes.Point ? "mapPin" : "roundedSquare"}
      color={
        REFERENCE_LAYER_COLOR_CODES[
          layer.layer_color ? layer.layer_color : ReferenceLayerColors.Green
        ]
      }
    ></Icon>
    <span sx={{ pl: 1 }}>{layer.name}</span>
    {!isReadOnly && (
      <Box sx={{ ml: "auto" }}>
        <ReferenceLayerFlyout layer={layer} />
      </Box>
    )}
  </Flex>
);

const ProjectReferenceLayers = ({
  isReadOnly,
  referenceLayers,
  showReferenceLayers
}: {
  readonly isReadOnly: boolean;
  readonly referenceLayers?: readonly IReferenceLayer[];
  readonly showReferenceLayers: ReadonlySet<ReferenceLayerId>;
}) => {
  const [isExpanded, setExpanded] = useState(referenceLayers?.length !== 0);

  return (
    <Flex sx={style.referenceLayers}>
      <Flex sx={style.referenceHeader}>
        <Heading as="h5" sx={{ variant: "text.h5", m: "0", fontSize: 2, display: "inline" }}>
          Reference layers
        </Heading>
        <Button
          sx={{ variant: "buttons.icon", float: "right" }}
          onClick={() => {
            setExpanded(!isExpanded);
          }}
        >
          <Icon name={isExpanded ? "horizontalRule" : "plus"} />
        </Button>
      </Flex>
      {isExpanded && (
        <Flex sx={style.referenceLayerList}>
          {referenceLayers && referenceLayers.length !== 0 ? (
            referenceLayers.map(layer => (
              <ReferenceLayer
                key={layer.id}
                layer={layer}
                checked={showReferenceLayers.has(layer.id)}
                isReadOnly={isReadOnly}
              />
            ))
          ) : referenceLayers !== undefined ? (
            <Box sx={{ pb: 1, maxWidth: "fit-content" }}>
              {isReadOnly
                ? "This map has no reference layers. Copy the map to your account to add reference layers."
                : "Add a polygon or point layer as a reference layer for your map."}
            </Box>
          ) : null}
          {!isReadOnly && (
            <Button
              sx={{ variant: "buttons.outlined" }}
              onClick={() => {
                store.dispatch(toggleReferenceLayersModal());
              }}
            >
              <Icon name="upload" /> Upload layer
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
};

export default ProjectReferenceLayers;
