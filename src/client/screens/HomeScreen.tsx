/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { Box, Flex, Heading, Text, jsx, Styled, Spinner } from "theme-ui";
import { ReactComponent as NoMapsIllustration } from "../media/no-maps-illustration.svg";
import PaginationFooter from "../components/PaginationFooter";

import { userProjectsFetch, userProjectsFetchPage } from "../actions/projects";
import { userFetch } from "../actions/user";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { UserState } from "../reducers/user";
import { Resource } from "../resource";
import store from "../store";
import { IProject, PaginationMetadata } from "../../shared/entities";
import DeleteProjectModal from "../components/DeleteProjectModal";
import SiteHeader from "../components/SiteHeader";
import HomeScreenProjectCard from "../components/HomeScreenProjectCard";
import { SavingState } from "../types";
import { Redirect } from "react-router-dom";

interface StateProps {
  readonly projects: Resource<readonly IProject[]>;
  readonly isSaving: SavingState;
  readonly duplicatedProject: IProject | null;
  readonly pagination: PaginationMetadata;
  readonly user: UserState;
}

const HomeScreen = ({ projects, isSaving, duplicatedProject, user, pagination }: StateProps) => {
  const isLoggedIn = getJWT() !== null;
  const projectList =
    "resource" in projects ? projects.resource.filter(project => !project.archived) : [];

  useEffect(() => {
    isLoggedIn && store.dispatch(userProjectsFetch());
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  return isSaving === "saved" && duplicatedProject !== null ? (
    <Redirect to={`/projects/${duplicatedProject.id}`} />
  ) : (
    <Flex sx={{ flexDirection: "column" }}>
      <DeleteProjectModal />
      <SiteHeader user={user} />
      <Flex
        as="main"
        sx={{ width: "100%", maxWidth: "large", my: 6, mx: "auto", flexDirection: "column", px: 4 }}
      >
        {projectList.length > 0 && (
          <Flex sx={{ mb: 3 }}>
            <Heading as="h1" sx={{ variant: "text.h3", mr: "auto" }}>
              Maps
            </Heading>
            <Styled.a
              as={Link}
              to="/import-project"
              sx={{ variant: "links.secondaryButton", fontSize: 2, px: 4, py: 2, mr: 2 }}
            >
              Import
            </Styled.a>
            <Styled.a
              as={Link}
              to="/create-project"
              sx={{ variant: "links.button", fontSize: 2, px: 4, py: 2 }}
            >
              <Icon name="plus-circle" />
              New map
            </Styled.a>
          </Flex>
        )}

        {"resource" in projects && isSaving === "unsaved" ? (
          projectList.length > 0 ? (
            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: "2px",
                boxShadow: "0 0 4px rgb(0 0 0 / 13%)",
                marginTop: "16px"
              }}
            >
              {projectList.map((project: IProject) => (
                <HomeScreenProjectCard project={project} key={project.id} />
              ))}
              {pagination.totalPages && (
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
                    setPage={number => store.dispatch(userProjectsFetchPage(number))}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "start",
                maxWidth: "500px",
                mt: 7,
                mx: "auto"
              }}
            >
              <Box sx={{ mb: 5 }}>
                <NoMapsIllustration />
              </Box>
              <Heading sx={{ variant: "text.h4" }}>Welcome to DistrictBuilder!</Heading>
              <Text sx={{ fontSize: 3, color: "text", mb: 5, mt: 3 }}>
                We believe in the power of individuals like you to draw maps that reflect local
                communities and lead to fair representation. We are excited to see what you build!
                And for extra help, check out the{" "}
                <Styled.a
                  href="https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder"
                  target="_blank"
                >
                  getting started guide
                </Styled.a>{" "}
                or see <Styled.a href="/maps">community maps</Styled.a>.
              </Text>
              <Flex>
                <Styled.a
                  as={Link}
                  to="/create-project"
                  sx={{ variant: "links.button", fontSize: 3, px: 4, py: 2 }}
                >
                  <Icon name="plus-circle" />
                  Create a map
                </Styled.a>
                <Styled.a
                  as={Link}
                  to="/import-project"
                  sx={{ variant: "links.secondaryButton", fontSize: 3, px: 4, py: 2, ml: 2 }}
                >
                  Import map
                </Styled.a>
              </Flex>
            </Flex>
          )
        ) : ("isPending" in projects && projects.isPending) || isSaving === "saving" ? (
          <Flex sx={{ justifyContent: "center" }}>
            <Spinner variant="spinner.large" />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects.projects,
    isSaving: state.project.saving,
    duplicatedProject: state.project.duplicatedProject || null,
    user: state.user,
    pagination: state.projects.userProjectsPagination
  };
}

export default connect(mapStateToProps)(HomeScreen);
