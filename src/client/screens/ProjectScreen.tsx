/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Flex, jsx } from "theme-ui";
import { IUser } from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
import { userFetch } from "../actions/user";
import "../App.css";
import CenteredContent from "../components/CenteredContent";
import Map from "../components/map/Map";
import MapHeader from "../components/MapHeader";
import ProjectHeader from "../components/ProjectHeader";
import ProjectSidebar from "../components/ProjectSidebar";
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

const FullScreenApp = ({ children }: { readonly children: React.ReactNode }) => {
  return <Flex sx={{ height: "100%", flexDirection: "column" }}>{children}</Flex>;
};

const Main = ({ children }: { readonly children: React.ReactNode }) => {
  return <Flex sx={{ flex: 1, overflowY: "auto" }}>{children}</Flex>;
};

const MapContainer = ({ children }: { readonly children: React.ReactNode }) => {
  return <Flex sx={{ flexDirection: "column", flex: 1 }}>{children}</Flex>;
};

const ProjectScreen = ({ projectData, user, districtDrawing }: StateProps) => {
  const { projectId } = useParams();
  const project = "resource" in projectData.project ? projectData.project.resource : undefined;
  const geojson = "resource" in projectData.geojson ? projectData.geojson.resource : undefined;
  const staticMetadata =
    "resource" in projectData.staticMetadata ? projectData.staticMetadata.resource : undefined;
  const staticGeoLevels =
    "resource" in projectData.staticGeoLevels ? projectData.staticGeoLevels.resource : undefined;
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

  useEffect(() => {
    store.dispatch(userFetch());
    projectId && store.dispatch(projectDataFetch(projectId));
  }, [projectId]);

  return "isPending" in user ? (
    <CenteredContent>Loading...</CenteredContent>
  ) : "errorMessage" in user ? (
    <Redirect to={"/login"} />
  ) : (
    <FullScreenApp>
      <ProjectHeader project={project} />
      <Main>
        <ProjectSidebar
          project={project}
          geojson={geojson}
          isLoading={isLoading}
          staticMetadata={staticMetadata}
          staticGeoLevels={staticGeoLevels}
          staticDemographics={staticDemographics}
          selectedDistrictId={districtDrawing.selectedDistrictId}
          selectedGeounits={Array.from(districtDrawing.selectedGeounits.values())}
          geoLevelIndex={districtDrawing.geoLevelIndex}
          geoUnitHierarchy={geoUnitHierarchy}
        />
        <MapContainer>
          <MapHeader
            label={label}
            setMapLabel={setMapLabel}
            metadata={staticMetadata}
            selectionTool={districtDrawing.selectionTool}
            geoLevelIndex={districtDrawing.geoLevelIndex}
          />
          {"resource" in projectData.project &&
          "resource" in projectData.staticMetadata &&
          "resource" in projectData.staticGeoLevels &&
          "resource" in projectData.staticDemographics &&
          "resource" in projectData.geojson ? (
            <Map
              project={projectData.project.resource}
              geojson={projectData.geojson.resource}
              staticMetadata={projectData.staticMetadata.resource}
              staticGeoLevels={projectData.staticGeoLevels.resource}
              staticDemographics={projectData.staticDemographics.resource}
              selectedGeounits={districtDrawing.selectedGeounits}
              selectedDistrictId={districtDrawing.selectedDistrictId}
              selectionTool={districtDrawing.selectionTool}
              geoLevelIndex={districtDrawing.geoLevelIndex}
              label={label}
            />
          ) : null}
        </MapContainer>
      </Main>
    </FullScreenApp>
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
