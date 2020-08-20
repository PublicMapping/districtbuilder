/** @jsx jsx */
import { useEffect, useState } from "react";
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
import { ProjectDataState } from "../reducers/projectData";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly projectData: ProjectDataState;
  readonly user: Resource<IUser>;
  readonly districtDrawing: DistrictDrawingState;
}

const ProjectScreen = ({ projectData, user, districtDrawing }: StateProps) => {
  const { projectId } = useParams();
  const project = "resource" in projectData.project ? projectData.project.resource : undefined;
  const geojson = "resource" in projectData.geojson ? projectData.geojson.resource : undefined;
  const staticMetadata =
    "resource" in projectData.staticMetadata ? projectData.staticMetadata.resource : undefined;
  const staticDemographics =
    "resource" in projectData.staticDemographics
      ? projectData.staticDemographics.resource
      : undefined;
  const geoUnitHierarchy =
    "resource" in projectData.geoUnitHierarchy ? projectData.geoUnitHierarchy.resource : undefined;
  const isLoading =
    ("isPending" in projectData.project && projectData.project.isPending) ||
    ("isPending" in projectData.geojson && projectData.geojson.isPending);

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
          {"resource" in projectData.project &&
          "resource" in projectData.staticMetadata &&
          "resource" in projectData.staticDemographics &&
          "resource" in projectData.staticGeoLevels &&
          "resource" in projectData.geojson ? (
            <Map
              project={projectData.project.resource}
              geojson={projectData.geojson.resource}
              staticMetadata={projectData.staticMetadata.resource}
              staticDemographics={projectData.staticDemographics.resource}
              staticGeoLevels={projectData.staticGeoLevels.resource}
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
