/** @jsx jsx */
import { connect } from "react-redux";
import { Button, Flex, Heading, jsx, Spinner, Text, ThemeUIStyleObject } from "theme-ui";

import { GeoUnits } from "../../shared/entities";
import { SavingState } from "../types";
import { areAnyGeoUnitsSelected, destructureResource } from "../functions";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

import { updateDistrictsDefinition } from "../actions/projectData";
import { clearSelectedGeounits } from "../actions/districtDrawing";
import { State } from "../reducers";
import store from "../store";

interface LoadingProps {
  readonly isLoading: boolean;
}

const style: ThemeUIStyleObject = {
  header: {
    variant: "header.app",
    borderBottom: "1px solid",
    borderColor: "gray.2"
  }
};

interface StateProps {
  readonly isReadOnly: boolean;
}

const ProjectSidebarHeader = ({
  selectedGeounits,
  isLoading,
  isReadOnly,
  saving
}: {
  readonly selectedGeounits: GeoUnits;
  readonly saving: SavingState;
} & LoadingProps &
  StateProps) => {
  return (
    <Flex sx={style.header}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
          Districts
        </Heading>
      </Flex>
      {isLoading || saving === "saving" ? (
        <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
          <Spinner variant="spinner.small" />
        </Flex>
      ) : areAnyGeoUnitsSelected(selectedGeounits) ? (
        <Flex sx={{ variant: "header.right" }}>
          <Tooltip
            placement="top-start"
            content={
              <span>
                <strong>{!isReadOnly ? "Cancel" : "Clear"} changes</strong> to revert to{" "}
                {!isReadOnly ? "your" : "the"} previously saved map
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
              {!isReadOnly ? "Cancel" : "Clear"}
            </Button>
          </Tooltip>
          {!isReadOnly && (
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
                  store.dispatch(updateDistrictsDefinition());
                }}
              >
                <Icon name="check" />
                Accept
              </Button>
            </Tooltip>
          )}
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
  const project = destructureResource(state.project.projectData, "project");
  return {
    isReadOnly:
      !("resource" in state.user) ||
      (project !== undefined && state.user.resource.id !== project.user.id)
  };
}

export default connect(mapStateToProps)(ProjectSidebarHeader);
