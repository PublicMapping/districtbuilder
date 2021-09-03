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
  RegionLookupProperties,
  IUser,
  UintArrays,
  IReferenceLayer
} from "../../shared/entities";
import { ElectionYear, EvaluateMetricWithValue } from "../types";

import {
  projectDataFetch,
  clearDuplicationState,
  projectReferenceLayersFetch
} from "../actions/projectData";
import { DistrictDrawingState } from "../reducers/districtDrawing";
import { resetProjectState } from "../actions/root";
import { userFetch } from "../actions/user";
import "../App.css";
import AdvancedEditingModal from "../components/map/AdvancedEditingModal";
import CenteredContent from "../components/CenteredContent";
import CopyMapModal from "../components/CopyMapModal";
import KeyboardShortcutsModal from "../components/map/KeyboardShortcutsModal";
import Map from "../components/map/Map";
import MapHeader from "../components/MapHeader";
import ProjectHeader from "../components/ProjectHeader";
import ProjectSidebar from "../components/ProjectSidebar";
import Tour from "../components/Tour";
import { isUserLoggedIn } from "../jwt";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";
import { useBeforeunload } from "react-beforeunload";
import PageNotFoundScreen from "./PageNotFoundScreen";
import SiteHeader from "../components/SiteHeader";
import ProjectEvaluateSidebar from "../components/evaluate/ProjectEvaluateSidebar";
import ConvertMapModal from "../components/ConvertMapModal";
import AddReferenceLayerModal from "../components/AddReferenceLayerModal";

interface StateProps {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly projectNotFound?: boolean;
  readonly findMenuOpen: boolean;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly evaluateMode: boolean;
  readonly evaluateMetric: EvaluateMetricWithValue | undefined;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly expandedProjectMetrics?: boolean;
  readonly districtDrawing: DistrictDrawingState;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly isArchived: boolean;
  readonly referenceLayers: Resource<readonly IReferenceLayer[]>;
  readonly mapLabel: string | undefined;
  readonly user: Resource<IUser>;
  readonly electionYear: ElectionYear;
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
  evaluateMode,
  evaluateMetric,
  regionProperties,
  projectNotFound,
  findMenuOpen,
  geoUnitHierarchy,
  districtDrawing,
  mapLabel,
  isLoading,
  referenceLayers,
  isReadOnly,
  isArchived,
  user,
  electionYear
}: StateProps) => {
  const { projectId } = useParams();
  const [map, setMap] = useState<MapboxGL.Map | undefined>(undefined);
  const isLoggedIn = isUserLoggedIn();
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

  // Clear duplication state when mounting, in case the user navigated to project page from a post-duplication redirect
  useEffect(() => {
    store.dispatch(clearDuplicationState());
  }, []);

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
    projectId && store.dispatch(projectReferenceLayersFetch(projectId));
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
        {!evaluateMode ? (
          <ProjectSidebar
            project={project}
            geojson={geojson}
            isLoading={isLoading}
            staticMetadata={staticMetadata}
            selectedDistrictId={districtDrawing.selectedDistrictId}
            selectedGeounits={presentDrawingState.selectedGeounits}
            highlightedGeounits={districtDrawing.highlightedGeounits}
            expandedProjectMetrics={districtDrawing.expandedProjectMetrics}
            geoUnitHierarchy={geoUnitHierarchy}
            referenceLayers={referenceLayers}
            showReferenceLayers={districtDrawing.showReferenceLayers}
            lockedDistricts={presentDrawingState.lockedDistricts}
            hoveredDistrictId={districtDrawing.hoveredDistrictId}
            saving={districtDrawing.saving}
            isReadOnly={isReadOnly}
            pinnedMetrics={districtDrawing.undoHistory.present.state.pinnedMetricFields}
          />
        ) : (
          <ProjectEvaluateSidebar
            geojson={geojson}
            metric={evaluateMetric}
            project={project}
            regionProperties={regionProperties}
            staticMetadata={staticMetadata}
          />
        )}
        {
          <Flex
            sx={{
              flexDirection: "column",
              flex: 1,
              background: "#fff",
              display: !evaluateMode && districtDrawing.expandedProjectMetrics ? "none" : "flex"
            }}
          >
            {!evaluateMode ? (
              <MapHeader
                label={mapLabel}
                metadata={staticMetadata}
                selectionTool={districtDrawing.selectionTool}
                findMenuOpen={findMenuOpen}
                paintBrushSize={districtDrawing.paintBrushSize}
                geoLevelIndex={presentDrawingState.geoLevelIndex}
                selectedGeounits={presentDrawingState.selectedGeounits}
                limitSelectionToCounty={districtDrawing.limitSelectionToCounty}
                advancedEditingEnabled={project?.advancedEditingEnabled}
                isReadOnly={isReadOnly}
                electionYear={electionYear}
              />
            ) : (
              <Flex></Flex>
            )}

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
                  hoveredDistrictId={districtDrawing.hoveredDistrictId}
                  zoomToDistrictId={districtDrawing.zoomToDistrictId}
                  selectionTool={districtDrawing.selectionTool}
                  paintBrushSize={districtDrawing.paintBrushSize}
                  geoLevelIndex={presentDrawingState.geoLevelIndex}
                  expandedProjectMetrics={districtDrawing.expandedProjectMetrics}
                  lockedDistricts={presentDrawingState.lockedDistricts}
                  evaluateMode={evaluateMode}
                  evaluateMetric={evaluateMetric}
                  isReadOnly={isReadOnly}
                  isArchived={isArchived}
                  limitSelectionToCounty={districtDrawing.limitSelectionToCounty}
                  label={mapLabel}
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
                <ConvertMapModal project={project} />
                <KeyboardShortcutsModal
                  isReadOnly={isReadOnly}
                  evaluateMode={evaluateMode}
                  staticMetadata={staticMetadata}
                />
                <AddReferenceLayerModal project={project} />
                <Flex id="tour-start" sx={style.tourStart}></Flex>
              </React.Fragment>
            ) : null}
          </Flex>
        }
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  const project: IProject | undefined = destructureResource(state.project.projectData, "project");
  return {
    project,
    geojson: destructureResource(state.project.projectData, "geojson"),
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata"),
    staticGeoLevels: destructureResource(state.project.staticData, "staticGeoLevels"),
    geoUnitHierarchy: destructureResource(state.project.staticData, "geoUnitHierarchy"),
    evaluateMode: state.project.evaluateMode,
    evaluateMetric: state.project.evaluateMetric,
    findMenuOpen: state.project.findMenuOpen,
    mapLabel: state.project.mapLabel,
    electionYear: state.project.electionYear,
    districtDrawing: state.project,
    referenceLayers: state.project.referenceLayers,
    regionProperties: state.regionConfig.regionProperties,
    isLoading:
      ("isPending" in state.project.projectData && state.project.projectData.isPending) ||
      ("isPending" in state.project.staticData && state.project.staticData.isPending),
    projectNotFound:
      "statusCode" in state.project.projectData && state.project.projectData.statusCode === 404,
    isArchived: project !== undefined && project.regionConfig.archived,
    isReadOnly:
      !("resource" in state.user) ||
      (project !== undefined && state.user.resource.id !== project.user.id) ||
      (project !== undefined && project.regionConfig.archived),
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
