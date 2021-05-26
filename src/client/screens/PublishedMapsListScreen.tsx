/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Flex, jsx, Spinner, Box, Heading, Text } from "theme-ui";
import { IProject, ProjectNest } from "../../shared/entities";
import "../App.css";
import { State } from "../reducers";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import { globalProjectsFetch, globalProjectsFetchPage } from "../actions/projects";
import { UserState } from "../reducers/user";
import FeaturedProjectCard from "../components/FeaturedProjectCard";
import PaginationFooter from "../components/PaginationFooter";
import { isEqual } from "lodash";

interface StateProps {
  readonly globalProjects?: readonly IProject[];
  readonly pagination: {
    readonly currentPage: number;
    readonly limit: number;
    readonly totalItems?: number;
    readonly totalPages?: number;
  };
  readonly user: UserState;
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

const PublishedMapsListScreen = ({ globalProjects, user, pagination }: StateProps) => {
  const [projects, setProjects] = useState<readonly IProject[] | undefined>(undefined);

  useEffect(() => {
    !globalProjects && store.dispatch(globalProjectsFetch());
    if (globalProjects) {
      if (!isEqual(projects, globalProjects)) {
        setProjects(globalProjects);
      }
    }
  }, [globalProjects, projects]);

  return (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Box>
        {projects ? (
          <Box sx={style.projects}>
            <Heading as="h2" sx={{ mb: "3" }}>
              <span>All published maps</span>
            </Heading>
            <Text>A collection of maps built by all DistrictBuilder users globally</Text>
            <Box sx={style.featuredProjectContainer}>
              {projects.length > 0 ? (
                projects.map((project: ProjectNest) => (
                  <FeaturedProjectCard project={project} key={project.id} />
                ))
              ) : (
                <Box>There are no published maps yet.</Box>
              )}
            </Box>
            {pagination.totalPages && (
              <PaginationFooter
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                setPage={number => store.dispatch(globalProjectsFetchPage(number))}
              />
            )}
          </Box>
        ) : (
          <Flex sx={{ justifyContent: "center" }}>
            <Spinner variant="spinner.large" />
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    globalProjects:
      "resource" in state.projects.globalProjects
        ? state.projects.globalProjects.resource
        : undefined,
    pagination: state.projects.globalProjectsPagination,
    user: state.user
  };
}

export default connect(mapStateToProps)(PublishedMapsListScreen);
