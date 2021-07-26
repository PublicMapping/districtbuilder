/** @jsx jsx */
import { Box, Flex, Heading, jsx } from "theme-ui";
import { useHistory } from "react-router-dom";

import { IProject } from "../../shared/entities";
import ProjectListFlyout from "./ProjectListFlyout";
import TimeAgo from "timeago-react";
import ProjectDistrictsMap from "./map/ProjectDistrictsMap";

const style = {
  featuredProject: {
    width: "100%",
    bg: "#fff",
    borderRadius: "2px",
    display: "inline-block",
    mb: "20px",
    boxShadow: "small",
    position: "relative"
  },
  mapLabel: {
    p: "15px",
    display: "inline-block",
    width: "600px",
    pl: "100px",
    borderColor: "gray.2",
    position: "absolute"
  },
  projectTitle: {
    display: "inline-block",
    width: "300px",
    "&:hover": {
      cursor: "pointer"
    }
  },
  projectRow: {
    textDecoration: "none",
    display: "flex",
    alignItems: "baseline",
    borderRadius: "med",
    marginRight: "auto",
    px: 1,
    "&:hover:not([disabled])": {
      bg: "rgba(256,256,256,0.2)",
      h2: {
        color: "primary",
        textDecoration: "underline"
      },
      p: {
        color: "blue.6"
      }
    },
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
  flyoutButton: {
    position: "absolute",
    top: "5px",
    right: "10px"
  }
} as const;

const HomeScreenProjectCard = ({ project }: { readonly project: IProject }) => {
  const history = useHistory();

  function goToProject(project: IProject) {
    history.push(`/projects/${project.id}`);
  }

  return (
    <Flex sx={style.featuredProject}>
      <ProjectDistrictsMap project={project} context={"home"} />
      <Box sx={style.mapLabel}>
        <Box sx={style.projectTitle} onClick={() => goToProject(project)}>
          <span sx={{ display: "inline-block" }}>
            <Heading
              as="h2"
              sx={{
                fontFamily: "heading",
                variant: "text.h5",
                fontWeight: "light",
                mr: 3
              }}
            >
              {project.name}
            </Heading>
          </span>
          <p sx={{ fontSize: 2, color: "gray.7" }}>
            ({project.regionConfig.name}, {project.numberOfDistricts} districts)
          </p>
        </Box>
        <div
          sx={{
            fontWeight: "light",
            color: "gray.5",
            paddingLeft: "5px"
          }}
        >
          Last updated <TimeAgo datetime={project.updatedDt} />
        </div>
      </Box>
      <span sx={style.flyoutButton}>
        <ProjectListFlyout project={project} sx={{ display: "inline-block" }} />
      </span>
    </Flex>
  );
};

export default HomeScreenProjectCard;
