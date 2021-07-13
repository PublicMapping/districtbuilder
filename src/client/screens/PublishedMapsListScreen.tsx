/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Flex, jsx, Spinner, Box, Heading, Text, Label, Select } from "theme-ui";
import { IProject, ProjectNest, IRegionConfig, PaginationMetadata } from "../../shared/entities";
import "../App.css";
import { State } from "../reducers";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import {
  globalProjectsFetch,
  globalProjectsFetchPage,
  globalProjectsSetRegion
} from "../actions/projects";
import { UserState } from "../reducers/user";
import FeaturedProjectCard from "../components/FeaturedProjectCard";
import PaginationFooter from "../components/PaginationFooter";
import { isEqual } from "lodash";
import { regionConfigsFetch } from "../actions/regionConfig";
import { capitalizeFirstLetter } from "../functions";
import { Resource } from "../resource";
import { useQueryParam, StringParam } from "use-query-params";

interface StateProps {
  readonly globalProjects: Resource<readonly IProject[]>;
  readonly pagination: PaginationMetadata;
  readonly user: UserState;
  readonly region: string | null;
  readonly regionConfigs?: readonly IRegionConfig[];
}

const style = {
  projects: {
    pt: 4,
    pb: 8,
    flexDirection: "row",
    width: "large",
    mx: "auto",
    "> *": {
      mx: 5
    },
    "> *:last-of-type": {
      mr: 0
    },
    "> *:first-of-type": {
      ml: 0
    }
  },
  featuredProjectContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridGap: "15px",
    justifyContent: "space-between",
    marginTop: "4"
  },
  pagination: {
    cursor: "pointer"
  }
} as const;

const PublishedMapsListScreen = ({
  globalProjects,
  user,
  pagination,
  region,
  regionConfigs
}: StateProps) => {
  const [projects, setProjects] = useState<readonly IProject[] | undefined>(undefined);
  const [regionCode, setRegionCode] = useQueryParam("region", StringParam);

  useEffect(() => {
    store.dispatch(globalProjectsSetRegion(regionCode || null));
  }, [regionCode]);

  useEffect(() => {
    "isPending" in globalProjects &&
      !globalProjects.isPending &&
      store.dispatch(globalProjectsFetch());
    if ("resource" in globalProjects) {
      if (!isEqual(projects, globalProjects.resource)) {
        setProjects(globalProjects.resource);
      }
    }
  }, [globalProjects, projects]);

  useEffect(() => {
    !regionConfigs && store.dispatch(regionConfigsFetch());
  }, [regionConfigs]);

  const regionConfigOptions = regionConfigs
    ? regionConfigs.map(rc => (
        <option key={rc.regionCode} value={rc.regionCode}>
          {capitalizeFirstLetter(rc.regionCode)}
        </option>
      ))
    : [];
  return (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Box sx={{ flex: 1 }}>
        <Box sx={style.projects}>
          <Heading as="h2" sx={{ my: "3" }}>
            <span>Community maps</span>
          </Heading>
          <Text>Explore published maps from across the entire DistrictBuilder community</Text>
          <Box>
            <Box>
              <Flex sx={{ alignItems: "baseline" }}>
                <Label
                  htmlFor="region-dropdown"
                  sx={{ display: "inline-block", width: "auto", mb: 0, mr: 2 }}
                >
                  Filter by state:
                </Label>
                <Select
                  id="region-dropdown"
                  value={region || "Select..."}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const label =
                      e.currentTarget.value !== "All states" ? e.currentTarget.value : null;
                    setRegionCode(label);
                    store.dispatch(globalProjectsSetRegion(label));
                  }}
                  sx={{ width: "150px" }}
                >
                  <option value={undefined}>All states</option>
                  {regionConfigOptions}
                </Select>
              </Flex>
            </Box>
          </Box>
          {projects && !("isPending" in globalProjects) ? (
            <React.Fragment>
              {projects.length > 0 ? (
                <Box sx={style.featuredProjectContainer}>
                  {projects.map((project: ProjectNest) => (
                    <FeaturedProjectCard project={project} key={project.id} />
                  ))}
                </Box>
              ) : (
                <Box>
                  {region
                    ? `There are no published maps yet for ${region}.`
                    : "There are no published maps yet"}
                </Box>
              )}
              {pagination.totalPages && pagination.totalPages > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <PaginationFooter
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    setPage={number => store.dispatch(globalProjectsFetchPage(number))}
                  />
                </Box>
              ) : null}
            </React.Fragment>
          ) : (
            <Flex sx={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Spinner variant="spinner.large" />
            </Flex>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    globalProjects: state.projects.globalProjects,
    pagination: state.projects.globalProjectsPagination,
    user: state.user,
    region: state.projects.globalProjectsRegion,
    regionConfigs:
      "resource" in state.regionConfig.regionConfigs
        ? state.regionConfig.regionConfigs.resource
        : undefined
  };
}

export default connect(mapStateToProps)(PublishedMapsListScreen);
