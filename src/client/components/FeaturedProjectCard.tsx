/** @jsx jsx */
import { Box, Flex, Heading, jsx, Text, ThemeUIStyleObject } from "theme-ui";
import { useHistory } from "react-router-dom";

import { ProjectNest } from "../../shared/entities";
import ProjectDistrictsMap from "./map/ProjectDistrictsMap";

const style: Record<string, ThemeUIStyleObject> = {
  featuredProject: {
    flexDirection: "column",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small",
    "&:hover": {
      cursor: "pointer"
    }
  },
  mapLabel: {
    p: "15px",
    borderColor: "gray.2",
    borderTopWidth: "1px",
    borderTopStyle: "solid"
  }
};

const FeaturedProjectCard = ({ project }: { readonly project: ProjectNest }) => {
  const history = useHistory();
  function goToProject(project: ProjectNest) {
    history.push(`/projects/${project.id}`);
  }

  return (
    <Flex sx={style.featuredProject} onClick={() => goToProject(project)}>
      <ProjectDistrictsMap project={project} context={"communityMaps"} />
      <Box sx={style.mapLabel}>
        <Heading
          as="h3"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "2",
            mb: "1"
          }}
        >
          {project.name}
        </Heading>
        <Text
          sx={{
            fontSize: "1"
          }}
        >
          by {project.user?.name}
        </Text>
      </Box>
    </Flex>
  );
};

export default FeaturedProjectCard;
