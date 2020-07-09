/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useParams } from "react-router-dom";
import { Box, Flex, Label, Select, jsx } from "theme-ui";

import { IUser, IStaticMetadata } from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
import { userFetch } from "../actions/user";
import "../App.css";
import CenteredContent from "../components/CenteredContent";
import Map from "../components/Map";
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

const MapHeader = ({
  label,
  setMapLabel,
  metadata
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
}) => {
  const options = metadata
    ? metadata.demographics.map(val => <option key={val.id}>{val.id}</option>)
    : [];
  return (
    <Box sx={{ variant: "header.app" }}>
      <Label>
        Label:
        <Select
          value={label}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const label = e.currentTarget.value;
            setMapLabel(label);
          }}
        >
          <option></option>
          {options}
        </Select>
      </Label>
    </Box>
  );
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
          selectedGeounitIds={districtDrawing.selectedGeounitIds}
        />
        <MapContainer>
          <MapHeader label={label} setMapLabel={setMapLabel} metadata={staticMetadata} />
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
              selectedGeounitIds={districtDrawing.selectedGeounitIds}
              selectedDistrictId={districtDrawing.selectedDistrictId}
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
