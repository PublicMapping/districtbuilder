/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Flex, jsx, Spinner, ThemeUIStyleObject, Box, Heading, Text } from "theme-ui";
import { IProject, ProjectNest } from "../../shared/entities";
import "../App.css";
import { State } from "../reducers";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import { globalProjectsFetch, globalProjectsFetchPage } from "../actions/projects";
import { UserState } from "../reducers/user";
import FeaturedProjectCard from "../components/FeaturedProjectCard";

interface StateProps {
  readonly globalProjects?: readonly IProject[];
  readonly pagination: {
    currentPage: number;
    limit: number;
    totalItems?: number;
    totalPages?: number;
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
};

const PublishedMapsListScreen = ({ globalProjects, user, pagination }: StateProps) => {
  const [pageNumbers, setPageNumbers] = useState<number[] | undefined>(undefined);
  useEffect(() => {
    store.dispatch(globalProjectsFetch());
  }, [pagination.currentPage]);

  useEffect(() => {
    if (pagination.totalPages) {
      const pn = [];
      for (let i = 1; i <= pagination.totalPages; i++) {
        pn.push(i);
      }
      console.log(pn);
      setPageNumbers(pn);
    }
  }, [pagination]);

  const renderPageNumbers =
    pageNumbers &&
    pageNumbers.map(number => {
      return (
        <li
          key={number}
          id={number.toString()}
          sx={style.pagination}
          onClick={() => store.dispatch(globalProjectsFetchPage(number))}
        >
          {number}
        </li>
      );
    });

  return (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Box>
        {globalProjects ? (
          // @ts-ignore
          <Box sx={style.projects}>
            <Heading as="h2" sx={{ mb: "3" }}>
              <span>All published maps</span>
            </Heading>
            <Text>A collection of maps built by all DistrictBuilder users globally</Text>
            <Box sx={style.featuredProjectContainer}>
              {globalProjects.length > 0 ? (
                globalProjects.map((project: ProjectNest) => (
                  <FeaturedProjectCard project={project} key={project.id} />
                ))
              ) : (
                <Box>There are no published maps yet.</Box>
              )}
            </Box>
            <ul id="page-numbers">{renderPageNumbers}</ul>
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
