/** @jsx jsx */
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { Button, Flex, Heading, jsx, Styled } from "theme-ui";

import { DistrictProperties, IProject } from "../../shared/entities";
import { getDistrictColor } from "../constants/colors";

import {
  clearSelectedGeounitIds,
  saveDistrictsDefinition,
  setSelectedDistrictId
} from "../actions/projectData";
import store from "../store";

// TODO: need to make it so the sidebar doesn't fully re-render when new information is fetched
const ProjectSidebar = ({
  project,
  geojson,
  selectedDistrictId,
  selectedGeounitIds
}: {
  readonly project?: IProject;
  readonly geojson?: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly selectedDistrictId: number;
  readonly selectedGeounitIds: ReadonlySet<number>;
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
    <SidebarHeader selectedGeounitIds={selectedGeounitIds} />
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
      <tbody>{project && geojson && getSidebarRows(project, geojson, selectedDistrictId)}</tbody>
    </Styled.table>
  </Flex>
);

const SidebarHeader = ({
  selectedGeounitIds
}: {
  readonly selectedGeounitIds: ReadonlySet<number>;
}) => {
  return (
    <Flex sx={{ variant: "header.app" }}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h3" sx={{ m: "0" }}>
          Districts
        </Heading>
      </Flex>
      {selectedGeounitIds.size ? (
        <Flex sx={{ variant: "header.right" }}>
          <Button
            variant="circularSubtle"
            sx={{ mr: "2", cursor: "pointer" }}
            onClick={() => {
              store.dispatch(clearSelectedGeounitIds());
            }}
          >
            Cancel
          </Button>
          <Button
            variant="circular"
            sx={{ cursor: "pointer" }}
            onClick={() => {
              store.dispatch(saveDistrictsDefinition());
            }}
          >
            Approve
          </Button>
        </Flex>
      ) : null}
    </Flex>
  );
};

// TODO: need to intermediate changes in populations as districts are selected
const SidebarRow = ({
  district,
  selected,
  deviation
}: {
  readonly district: Feature<MultiPolygon, DistrictProperties>;
  readonly selected: boolean;
  readonly deviation: number;
}) => {
  return (
    <Styled.tr
      sx={{ backgroundColor: selected ? "#efefef" : "inherit", cursor: "pointer" }}
      onClick={() => {
        store.dispatch(setSelectedDistrictId(district.id as number));
      }}
    >
      <Styled.td sx={{ textAlign: "left" }}>
        <span
          sx={{
            backgroundColor: getDistrictColor(district.id),
            marginRight: "7px"
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {district.id || "∅"}
      </Styled.td>
      <Styled.td>{district.properties.population.toLocaleString()}</Styled.td>
      <Styled.td>{(deviation > 0 ? "+" : "") + Math.round(deviation).toLocaleString()}</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>–</Styled.td>
    </Styled.tr>
  );
};

const getSidebarRows = (
  project: IProject,
  geojson: FeatureCollection<MultiPolygon, DistrictProperties>,
  selectedDistrictId: number
) => {
  const averagePopulation =
    geojson.features.reduce(
      (population, feature) => population + feature.properties.population,
      0
    ) / geojson.features.length;
  return geojson.features.map(feature => (
    <SidebarRow
      district={feature}
      selected={feature.id === selectedDistrictId}
      deviation={feature.properties.population - averagePopulation}
      key={feature.id}
    />
  ));
};

export default ProjectSidebar;
