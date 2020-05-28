/** @jsx jsx */
import { Button, Flex, Heading, jsx, Styled } from "theme-ui";

import { DistrictFeature, DistrictGeoJSON, IProject } from "../../shared/entities";

const ProjectSidebar = ({
  project,
  geojson
}: {
  readonly project?: IProject;
  readonly geojson?: DistrictGeoJSON;
}) => (
  <Flex
    sx={{
      background: "#fff",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
      position: "relative",
      flexShrink: 0,
      boxShadow: "0 0 1px #a9acae",
      minWidth: "300px"
    }}
  >
    <SidebarHeader />
    <Styled.table>
      <thead>
        <Styled.tr>
          <Styled.th>Number</Styled.th>
          <Styled.th>Population</Styled.th>
          <Styled.th>Deviation</Styled.th>
          <Styled.th>Race</Styled.th>
          <Styled.th>Pol.</Styled.th>
          <Styled.th>Comp.</Styled.th>
        </Styled.tr>
      </thead>
      <tbody>{project && geojson && getSidebarRows(project, geojson)}</tbody>
    </Styled.table>
  </Flex>
);

const SidebarHeader = () => {
  return (
    <Flex sx={{ variant: "header.app" }}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h3" sx={{ m: "0" }}>
          Districts
        </Heading>
      </Flex>
      <Flex sx={{ variant: "header.right" }}>
        <Button variant="circularSubtle" sx={{ mr: "2" }}>
          Cancel
        </Button>
        <Button variant="circular">Approve</Button>
      </Flex>
    </Flex>
  );
};

const SidebarRow = ({
  district,
  deviation
}: {
  readonly district: DistrictFeature;
  readonly deviation: number;
}) => {
  return (
    <Styled.tr>
      <Styled.td>{district.id}</Styled.td>
      <Styled.td>{district.properties.population.toLocaleString()}</Styled.td>
      <Styled.td>{(deviation > 0 ? "+" : "") + deviation.toLocaleString()}</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>–</Styled.td>
    </Styled.tr>
  );
};

const getSidebarRows = (project: IProject, geojson: DistrictGeoJSON) => {
  const averagePopulation =
    geojson.features.reduce(
      (population, feature) => population + feature.properties.population,
      0
    ) / geojson.features.length;
  return geojson.features.map(feature => (
    <SidebarRow
      district={feature}
      deviation={feature.properties.population - averagePopulation}
      key={feature.id}
    />
  ));
};

export default ProjectSidebar;
