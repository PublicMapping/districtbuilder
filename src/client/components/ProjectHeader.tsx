/** @jsx jsx */
import { Box, Flex, jsx, Text } from "theme-ui";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { IProject } from "../../shared/entities";
import { heights } from "../theme";

const HeaderDivider = () => {
  return (
    <Box
      sx={{
        marginLeft: 3,
        paddingLeft: 3,
        height: heights.header,
        borderLeft: "1px solid rgba(255, 255, 255, 0.25)"
      }}
    />
  );
};

const ProjectHeader = ({ project }: { readonly project?: IProject }) => (
  <Flex
    sx={{
      variant: "header.app",
      backgroundColor: "blue.8",
      borderBottom: "1px solid",
      borderColor: "blue.6"
    }}
  >
    <Flex sx={{ variant: "header.left" }}>
      <Link to="/" sx={{ lineHeight: "0" }}>
        <Logo sx={{ width: "1.75rem" }} />
      </Link>
      <HeaderDivider />
      <Flex
        sx={{
          color: "#fff",
          alignItems: "center"
        }}
      >
        <Text as="h1" sx={{ variant: "header.title", m: 0 }}>
          {project ? project.name : "..."}
        </Text>
      </Flex>
    </Flex>
    <Flex sx={{ variant: "header.right" }} />
  </Flex>
);

export default ProjectHeader;
