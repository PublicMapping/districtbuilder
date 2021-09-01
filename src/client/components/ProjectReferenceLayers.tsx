/** @jsx jsx */
import { useState } from "react";
import { Button, Flex, Box, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IReferenceLayer } from "../../shared/entities";
import Icon from "./Icon";
import { toggleReferenceLayersModal } from "../actions/projectData";

import store from "../store";
import { ReferenceLayerTypes } from "../../shared/constants";

const style: ThemeUIStyleObject = {
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

const ReferenceLayer = ({ layer }: { readonly layer: IReferenceLayer }) => (
  <Flex sx={{ alignItems: "center", pb: 1 }}>
    <Icon
      name={layer.layer_type === ReferenceLayerTypes.Point ? "mapPin" : "roundedSquare"}
      color={layer.layer_type === ReferenceLayerTypes.Point ? "green" : "blue.4"}
    ></Icon>
    <span sx={{ pl: 1 }}>{layer.name}</span>
  </Flex>
);

const ProjectReferenceLayers = ({
  referenceLayers
}: {
  readonly referenceLayers?: readonly IReferenceLayer[];
}) => {
  const [isExpanded, setExpanded] = useState(false);

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
            referenceLayers.map(layer => <ReferenceLayer key={layer.id} layer={layer} />)
          ) : referenceLayers !== undefined ? (
            <Box sx={{ pb: 1, maxWidth: "fit-content" }}>
              Add a polygon, line, or point layer as a reference layer for your map.
            </Box>
          ) : null}
          <Button
            sx={{ variant: "buttons.outlined" }}
            onClick={() => {
              store.dispatch(toggleReferenceLayersModal());
            }}
          >
            <Icon name="upload" /> Upload layer
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export default ProjectReferenceLayers;
