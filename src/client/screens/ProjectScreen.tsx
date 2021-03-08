/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Flex, jsx, Spinner, ThemeUIStyleObject } from "theme-ui";

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
import AdvancedEditingModal from "../components/map/AdvancedEditingModal";
import CenteredContent from "../components/CenteredContent";
import CopyMapModal from "../components/CopyMapModal";
import Map from "../components/map/Map";
import MapHeader from "../components/MapHeader";
import ProjectHeader from "../components/ProjectHeader";
import ProjectSidebar from "../components/ProjectSidebar";
import Tour from "../components/Tour";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";
import { useBeforeunload } from "react-beforeunload";
import PageNotFoundScreen from "./PageNotFoundScreen";
import SiteHeader from "../components/SiteHeader";

interface StateProps {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly projectNotFound?: boolean;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly districtDrawing: DistrictDrawingState;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly user: Resource<IUser>;
}

const style: ThemeUIStyleObject = {
  tourStart: {
    width: "300px",
    height: "10px",
    background: "transparent",
    bottom: "0",
    right: "10px",
    pointerEvents: "none",
    position: "absolute"
  }
};

const ProjectScreen = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  projectNotFound,
  geoUnitHierarchy,
  districtDrawing,
  isLoading,
  isReadOnly,
  user
}: StateProps) => {
  const { projectId } = useParams();
  const [label, setMapLabel] = useState<string | undefined>(undefined);
  const [map, setMap] = useState<MapboxGL.Map | undefined>(undefined);
  const isLoggedIn = getJWT() !== null;
  const isFirstLoadPending = isLoading && (project === undefined || staticMetadata === undefined);
  const presentDrawingState = districtDrawing.undoHistory.present.state;

  // Warn the user when attempting to leave the page with selected geounits
  useBeforeunload(event => {
    // Disabling 'functional/no-conditional-statement' without naming it.
    // eslint-disable-next-line
    if (areAnyGeoUnitsSelected(presentDrawingState.selectedGeounits)) {
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
    isLoggedIn && store.dispatch(userFetch());
    projectId && store.dispatch(projectDataFetch(projectId));
  }, [projectId, isLoggedIn]);

  return isFirstLoadPending ? (
    <CenteredContent>
      <Flex sx={{ justifyContent: "center" }}>
        <Spinner variant="spinner.large" />
      </Flex>
    </CenteredContent>
  ) : "errorMessage" in user ? (
    <Redirect to={"/login"} />
  ) : projectNotFound ? (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <SiteHeader user={user} />
      <PageNotFoundScreen model={"project"} />
    </Flex>
  ) : (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <ProjectHeader map={map} project={project} isReadOnly={isReadOnly} />
      <Flex sx={{ flex: 1, overflowY: "auto" }}>
        <ProjectSidebar
          project={project}
          geojson={geojson}
          isLoading={isLoading}
          staticMetadata={staticMetadata}
          selectedDistrictId={districtDrawing.selectedDistrictId}
          selectedGeounits={presentDrawingState.selectedGeounits}
          highlightedGeounits={districtDrawing.highlightedGeounits}
          geoUnitHierarchy={geoUnitHierarchy}
          lockedDistricts={presentDrawingState.lockedDistricts}
          saving={districtDrawing.saving}
          isReadOnly={isReadOnly}
        />
        <Flex sx={{ flexDirection: "column", flex: 1, background: "#fff" }}>
          <MapHeader
            label={label}
            setMapLabel={setMapLabel}
            metadata={staticMetadata}
            selectionTool={districtDrawing.selectionTool}
            geoLevelIndex={presentDrawingState.geoLevelIndex}
            selectedGeounits={presentDrawingState.selectedGeounits}
            advancedEditingEnabled={project?.advancedEditingEnabled}
            isReadOnly={isReadOnly}
          />
          {project && staticMetadata && staticGeoLevels && geojson ? (
            <React.Fragment>
              {!isReadOnly && "resource" in user && (
                <Tour
                  geojson={geojson}
                  project={project}
                  staticMetadata={staticMetadata}
                  user={user.resource}
                />
              )}
              <Map
                project={project}
                geojson={geojson}
                staticMetadata={staticMetadata}
                staticGeoLevels={staticGeoLevels}
                selectedGeounits={presentDrawingState.selectedGeounits}
                selectedDistrictId={districtDrawing.selectedDistrictId}
                selectionTool={districtDrawing.selectionTool}
                geoLevelIndex={presentDrawingState.geoLevelIndex}
                lockedDistricts={presentDrawingState.lockedDistricts}
                isReadOnly={isReadOnly}
                label={label}
                map={map}
                setMap={setMap}
              />
              {!isReadOnly && (
                <AdvancedEditingModal
                  id={project.id}
                  geoLevels={staticMetadata.geoLevelHierarchy}
                />
              )}
              <CopyMapModal project={project} />
              <Flex id="tour-start" sx={style.tourStart}></Flex>
            </React.Fragment>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  const project = destructureResource(state.project.projectData, "project");
  return {
    project,
    geojson: destructureResource(state.project.projectData, "geojson"),
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata"),
    staticGeoLevels: destructureResource(state.project.staticData, "staticGeoLevels"),
    geoUnitHierarchy: destructureResource(state.project.staticData, "geoUnitHierarchy"),
    districtDrawing: state.project,
    isLoading:
      ("isPending" in state.project.projectData && state.project.projectData.isPending) ||
      ("isPending" in state.project.staticData && state.project.staticData.isPending),
    projectNotFound:
      "statusCode" in state.project.projectData && state.project.projectData.statusCode === 404,
    isReadOnly:
      !("resource" in state.user) ||
      (project !== undefined && state.user.resource.id !== project.user.id),
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
