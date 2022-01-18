/** @jsx jsx */
import { Box, Flex, Heading, jsx, Text, ThemeUIStyleObject } from "theme-ui";
import { useHistory } from "react-router-dom";

import { IProject } from "../../shared/entities";
import ProjectListFlyout from "./ProjectListFlyout";
import TimeAgo from "timeago-react";
import ProjectDistrictsMap from "./map/ProjectDistrictsMap";

const style: Record<string, ThemeUIStyleObject> = {
  featuredProject: {
    width: "100%",
    bg: "transparent",
    position: "relative",
    borderBottom: "1px solid",
    borderColor: "gray.2",
    alignItems: "center"
  },
  mapLabel: {
    p: "15px"
  },
  projectTitle: {
    "&:hover": {
      cursor: "pointer"
    },
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      content: '""'
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
};

const HomeScreenProjectCard = ({ project }: { readonly project: IProject }) => {
  const history = useHistory();

  function goToProject(project: IProject) {
    history.push(`/projects/${project.id}`);
  }

  return (
    <Flex sx={style.featuredProject}>
      <Box sx={{ height: "125px", width: "125px", position: "relative", mx: 3 }}>
        <ProjectDistrictsMap project={project} context={"home"} />
      </Box>
      <Box sx={style.mapLabel}>
        <Box sx={style.projectTitle} onClick={() => goToProject(project)}>
          <Heading
            as="h2"
            sx={{
              fontFamily: "heading",
              variant: "text.h5",
              mr: 3,
              mb: 1
            }}
          >
            {project.name}
          </Heading>
          <Text sx={{ fontSize: 2, color: "gray.7" }}>
            {project.regionConfig.name} · {project.numberOfDistricts} districts
          </Text>
        </Box>
        <Text
          sx={{
            color: "gray.5",
            fontSize: 1
          }}
        >
          Last updated <TimeAgo datetime={project.updatedDt} />
        </Text>
      </Box>
      <span sx={style.flyoutButton}>
        <ProjectListFlyout project={project} />
      </span>
    </Flex>
  );
};

export default HomeScreenProjectCard;
