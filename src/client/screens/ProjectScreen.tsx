/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Box, Flex, jsx } from "theme-ui";

import { IUser } from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
import { userFetch } from "../actions/user";
import "../App.css";
import CenteredContent from "../components/CenteredContent";
import Map from "../components/Map";
import ProjectHeader from "../components/ProjectHeader";
import ProjectSidebar from "../components/ProjectSidebar";
import { State } from "../reducers";
import { ProjectDataState } from "../reducers/projectData";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly projectData: ProjectDataState;
  readonly user: Resource<IUser>;
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

const MapHeader = () => {
  return <Box sx={{ variant: "header.app", backgroundColor: "burlywood" }}>MapHeader</Box>;
};

const ProjectScreen = ({ projectData, user }: StateProps) => {
  const { projectId } = useParams();
  const project = "resource" in projectData.project ? projectData.project.resource : undefined;
  const geojson = "resource" in projectData.geojson ? projectData.geojson.resource : undefined;

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
        <ProjectSidebar project={project} geojson={geojson} />
        <MapContainer>
          <MapHeader />
          {"resource" in projectData.project &&
          "resource" in projectData.staticMetadata &&
          "resource" in projectData.staticGeoLevels &&
          "resource" in projectData.staticDemographics ? (
            <Map
              project={projectData.project.resource}
              staticMetadata={projectData.staticMetadata.resource}
              staticGeoLevels={projectData.staticGeoLevels.resource}
              staticDemographics={projectData.staticDemographics.resource}
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
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
