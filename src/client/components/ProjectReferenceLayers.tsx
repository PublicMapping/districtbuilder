/** @jsx jsx */
import { Button, Flex, Box, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IReferenceLayer } from "../../shared/entities";
import Icon from "./Icon";
import { toggleReferenceLayersModal } from "../actions/projectData";

import store from "../store";

const style: ThemeUIStyleObject = {
  referenceHeader: {
    p: 2,
    display: "block",
    width: "100%"
  },
  referenceLayers: {
    minHeight: "75px",
    position: "relative",
    width: "100%",
    bottom: "0px",
    display: "inline-block"
  },
  referenceLayerList: {
    position: "relative",
    top: "10px",
    display: "block"
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

const ProjectReferenceLayers = ({
  referenceLayers
}: {
  readonly referenceLayers?: readonly IReferenceLayer[];
}) => {
  return (
    <Flex sx={style.referenceLayers}>
      <Box sx={style.referenceHeader}>
        <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
          Reference layers
        </Heading>
        <Button
          sx={{ ...style.selectionButton }}
          onClick={() => {
            store.dispatch(toggleReferenceLayersModal());
          }}
        >
          <Icon name="plus" />
        </Button>
      </Box>
      <Box sx={style.referenceLayerList}>
        {referenceLayers && (
          <ul>
            {referenceLayers.map(layer => (
              <li key={layer.id}>{layer.name}</li>
            ))}
          </ul>
        )}
      </Box>
    </Flex>
  );
};

export default ProjectReferenceLayers;
