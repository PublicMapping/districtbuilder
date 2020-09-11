/** @jsx jsx */
import { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Flex, jsx, Spinner } from "theme-ui";

import { areAnyGeoUnitsSelected, destructureResource } from "../functions";
import { DistrictsGeoJSON } from "../types";
import {
  GeoUnitHierarchy,
  IProject,
  IStaticMetadata,
  IUser,
  UintArrays
} from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
import { DistrictDrawingState } from "../reducers/districtDrawing";
import { resetProjectState } from "../actions/root";
import { userFetch } from "../actions/user";
import "../App.css";
import CenteredContent from "../components/CenteredContent";
import Map from "../components/map/Map";
import MapHeader from "../components/MapHeader";
import ProjectHeader from "../components/ProjectHeader";
import ProjectSidebar from "../components/ProjectSidebar";
import Toast from "../components/Toast";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";
import { useBeforeunload } from "react-beforeunload";

interface StateProps {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly staticDemographics?: UintArrays;
  readonly staticGeoLevels: UintArrays;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly districtDrawing: DistrictDrawingState;
  readonly isLoading: boolean;
  readonly user: Resource<IUser>;
}

const ProjectScreen = ({
  project,
  geojson,
  staticMetadata,
  staticDemographics,
  staticGeoLevels,
  geoUnitHierarchy,
  districtDrawing,
  isLoading,
  user
}: StateProps) => {
  const { projectId } = useParams();
  const [label, setMapLabel] = useState<string | undefined>(undefined);

  // Warn the user when attempting to leave the page with selected geounits
  useBeforeunload(event => {
    // Disabling 'functional/no-conditional-statement' without naming it.
    // eslint-disable-next-line
    if (areAnyGeoUnitsSelected(districtDrawing.selectedGeounits)) {
      // Old style, used by e.g. Chrome
      // Disabling 'functional/immutable-data' without naming it.
      // eslint-disable-next-line
      event.returnValue = true;
      // New style, used by e.g. Firefox
      event.preventDefault();
      // The message isn't actually displayed on most browsers
      return "You have unsaved changes. Accept or reject changes to save your map.";
    }
  });

  // Reset component redux state on unmount
  useEffect(
    () => () => {
      store.dispatch(resetProjectState());
    },
    []
  );

  useEffect(() => {
    store.dispatch(userFetch());
    projectId && store.dispatch(projectDataFetch(projectId));
  }, [projectId]);

  const sidebar = useMemo(
    () => (
      <ProjectSidebar
        project={project}
        geojson={geojson}
        isLoading={isLoading}
        staticMetadata={staticMetadata}
        staticDemographics={staticDemographics}
        selectedDistrictId={districtDrawing.selectedDistrictId}
        selectedGeounits={districtDrawing.selectedGeounits}
        geoUnitHierarchy={geoUnitHierarchy}
        lockedDistricts={districtDrawing.lockedDistricts}
      />
    ),
    [
      project,
      geojson,
      isLoading,
      staticMetadata,
      staticDemographics,
      districtDrawing.selectedDistrictId,
      districtDrawing.selectedGeounits,
      geoUnitHierarchy,
      districtDrawing.lockedDistricts
    ]
  );

  return "isPending" in user ? (
    <CenteredContent>
      <Flex sx={{ justifyContent: "center" }}>
        <Spinner variant="spinner.large" />
      </Flex>
    </CenteredContent>
  ) : "errorMessage" in user ? (
    <Redirect to={"/login"} />
  ) : (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <Toast />
      <ProjectHeader project={project} />
      <Flex sx={{ flex: 1, overflowY: "auto" }}>
        {sidebar}
        <Flex sx={{ flexDirection: "column", flex: 1, background: "#fff" }}>
          <MapHeader
            label={label}
            setMapLabel={setMapLabel}
            metadata={staticMetadata}
            selectionTool={districtDrawing.selectionTool}
            geoLevelIndex={districtDrawing.geoLevelIndex}
            geoLevelVisibility={districtDrawing.geoLevelVisibility}
            selectedGeounits={districtDrawing.selectedGeounits}
            advancedEditingEnabled={project?.advancedEditingEnabled}
          />
          {project && staticMetadata && staticDemographics && staticGeoLevels && geojson ? (
            <Map
              project={project}
              geojson={geojson}
              staticMetadata={staticMetadata}
              staticDemographics={staticDemographics}
              staticGeoLevels={staticGeoLevels}
              selectedGeounits={districtDrawing.selectedGeounits}
              selectedDistrictId={districtDrawing.selectedDistrictId}
              selectionTool={districtDrawing.selectionTool}
              geoLevelIndex={districtDrawing.geoLevelIndex}
              lockedDistricts={districtDrawing.lockedDistricts}
              label={label}
            />
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    project: destructureResource(state.project.projectData, "project"),
    geojson: destructureResource(state.project.projectData, "geojson"),
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata"),
    staticGeoLevels: destructureResource(state.project.staticData, "staticGeoLevels"),
    staticDemographics: destructureResource(state.project.staticData, "staticDemographics"),
    geoUnitHierarchy: destructureResource(state.project.staticData, "geoUnitHierarchy"),
    districtDrawing: state.project,
    isLoading:
      ("isPending" in state.project.projectData && state.project.projectData.isPending) ||
      ("isPending" in state.project.staticData && state.project.staticData.isPending),
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
