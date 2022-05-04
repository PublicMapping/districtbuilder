/** @jsx jsx */
import { connect } from "react-redux";
import { Button, Box, Flex, Heading, jsx, Spinner, Text, ThemeUIStyleObject } from "theme-ui";

import { GeoUnits } from "@districtbuilder/shared/entities";
import { SavingState } from "../types";
import { areAnyGeoUnitsSelected, isProjectReadOnly } from "../functions";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

import {
  saveDistrictsDefinition,
  clearSelectedGeounits,
  toggleExpandedMetrics
} from "../actions/districtDrawing";
import { State } from "../reducers";
import store from "../store";

interface LoadingProps {
  readonly isLoading: boolean;
}

const style: Record<string, ThemeUIStyleObject> = {
  header: {
    variant: "styles.header.app",
    borderBottom: "1px solid",
    borderColor: "gray.2",
    m: 0
  },
  expandedToggle: {
    p: 1
  },
  expandButton: {
    variant: "buttons.icon",
    fontSize: 1,
    py: 1,
    ml: 1
  }
};

interface StateProps {
  readonly isReadOnly: boolean;
}

const ProjectSidebarHeader = ({
  selectedGeounits,
  isLoading,
  expandedProjectMetrics,
  isReadOnly,
  saving
}: {
  readonly selectedGeounits: GeoUnits;
  readonly saving: SavingState;
  readonly expandedProjectMetrics: boolean;
} & LoadingProps &
  StateProps) => {
  return (
    <Flex sx={style.header} className="sidebar-header">
      <Flex sx={{ variant: "styles.header.left" }}>
        <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
          Districts
        </Heading>
        <Box sx={style.expandedToggle}>
          <Button
            sx={style.expandButton}
            onClick={() => store.dispatch(toggleExpandedMetrics(!expandedProjectMetrics))}
          >
            {expandedProjectMetrics ? <Icon name="compress" /> : <Icon name="expand" />}
          </Button>
        </Box>
      </Flex>
      {isLoading || saving === "saving" ? (
        <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
          <Spinner variant="styles.spinner.small" />
        </Flex>
      ) : isReadOnly ? null : areAnyGeoUnitsSelected(selectedGeounits) ? (
        <Flex sx={{ variant: "styles.header.right" }}>
          <Tooltip
            placement="top-start"
            content={
              <span>
                <strong>Cancel changes</strong> to revert to your previously saved map
              </span>
            }
          >
            <Button
              variant="circularSubtle"
              sx={{ mr: "2" }}
              onClick={() => {
                store.dispatch(clearSelectedGeounits(true));
              }}
            >
              Cancel
            </Button>
          </Tooltip>
          <Tooltip
            placement="top-start"
            content={
              <span>
                <strong>Accept changes</strong> to save your map
              </span>
            }
          >
            <Button
              variant="circular"
              onClick={() => {
                store.dispatch(saveDistrictsDefinition());
              }}
            >
              <Icon name="check" />
              Accept
            </Button>
          </Tooltip>
        </Flex>
      ) : saving === "saved" ? (
        <Tooltip placement="top-start" content={<span>Your map is saved</span>}>
          <Flex sx={{ display: "flex", color: "gray.3", alignItems: "center", userSelect: "none" }}>
            <Icon name="check-circle" size={1.1} />
            <Text sx={{ fontSize: 1, ml: 1 }}>Saved</Text>
          </Flex>
        </Tooltip>
      ) : null}
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    isReadOnly: isProjectReadOnly(state)
  };
}

export default connect(mapStateToProps)(ProjectSidebarHeader);
