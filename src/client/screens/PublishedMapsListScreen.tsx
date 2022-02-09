/** @jsx jsx */
import React, { useEffect } from "react";
import { connect } from "react-redux";
import {
  Flex,
  jsx,
  Spinner,
  Box,
  Heading,
  Text,
  Label,
  Select,
  ThemeUIStyleObject
} from "theme-ui";
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
import { userFetch } from "../actions/user";
import { isUserLoggedIn } from "../jwt";
import FeaturedProjectCard from "../components/FeaturedProjectCard";
import PaginationFooter from "../components/PaginationFooter";
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

const style: Record<string, ThemeUIStyleObject> = {
  projects: {
    pt: 4,
    pb: 8,
    position: "relative",
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
};

const PublishedMapsListScreen = ({
  globalProjects,
  user,
  pagination,
  region,
  regionConfigs
}: StateProps) => {
  const [regionCode, setRegionCode] = useQueryParam("region", StringParam);
  const isLoggedIn = isUserLoggedIn();

  useEffect(() => {
    if (regionCode) {
      store.dispatch(globalProjectsSetRegion(regionCode));
    } else {
      store.dispatch(globalProjectsFetch());
    }
  }, []);

  useEffect(() => {
    store.dispatch(globalProjectsSetRegion(regionCode || null));
  }, [regionCode]);

  useEffect(() => {
    !regionConfigs && store.dispatch(regionConfigsFetch());
  }, [regionConfigs]);

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    //eslint-disable-next-line
    document.title = "DistrictBuilder | Community Maps " + (regionCode ? `| ${regionCode}` : "");
  });

  const regionConfigOptions = regionConfigs
    ? [...regionConfigs]
        .sort((a, b) => a.regionCode.localeCompare(b.regionCode))
        .map(rc => (
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
          <Flex>
            <Box sx={{ flex: 1 }}>
              <Heading as="h1" sx={{ my: "3" }}>
                <span>Community maps</span>
              </Heading>
              <Text>Explore published maps from across the entire DistrictBuilder community</Text>
            </Box>

            <Flex sx={{ alignItems: "baseline", my: "3" }}>
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
          </Flex>
          {"resource" in globalProjects ? (
            <React.Fragment>
              {globalProjects.resource.length > 0 ? (
                <Box sx={style.featuredProjectContainer}>
                  {globalProjects.resource.map((project: ProjectNest) => (
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
              <Spinner variant="styles.spinner.large" />
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
