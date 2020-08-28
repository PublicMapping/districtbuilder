/** @jsx jsx */
import { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Flex, jsx, Spinner } from "theme-ui";
import { IUser } from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
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
import { DistrictDrawingState } from "../reducers/districtDrawing";
import { isProjectDataLoading, ProjectDataState } from "../reducers/projectData";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly projectData: ProjectDataState;
  readonly user: Resource<IUser>;
  readonly districtDrawing: DistrictDrawingState;
}

const ProjectScreen = ({ projectData, user, districtDrawing }: StateProps) => {
  const { projectId } = useParams();
  const project =
    "resource" in projectData.projectData ? projectData.projectData.resource.project : undefined;
  const geojson =
    "resource" in projectData.projectData ? projectData.projectData.resource.geojson : undefined;
  const staticMetadata =
    "resource" in projectData.staticData
      ? projectData.staticData.resource.staticMetadata
      : undefined;
  const staticGeoLevels =
    "resource" in projectData.staticData
      ? projectData.staticData.resource.staticGeoLevels
      : undefined;
  const staticDemographics =
    "resource" in projectData.staticData
      ? projectData.staticData.resource.staticDemographics
      : undefined;
  const geoUnitHierarchy =
    "resource" in projectData.staticData
      ? projectData.staticData.resource.geoUnitHierarchy
      : undefined;
  const isLoading = isProjectDataLoading(projectData);

  const [label, setMapLabel] = useState<string | undefined>(undefined);

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
    projectData: state.projectData,
    user: state.user,
    districtDrawing: state.districtDrawing
  };
}

export default connect(mapStateToProps)(ProjectScreen);
