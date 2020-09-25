/** @jsx jsx */
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { Box, Flex, jsx, Text, ThemeUIStyleObject } from "theme-ui";
import { IProject } from "../../shared/entities";
import { heights } from "../theme";
import ShareMenu from "../components/ShareMenu";
import SupportMenu from "../components/SupportMenu";

const style: ThemeUIStyleObject = {
  projectHeader: {
    variant: "header.app",
    backgroundColor: "blue.8",
    borderBottom: "1px solid",
    borderColor: "blue.6"
  },
  menuButton: {
    color: "muted"
  }
};

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

interface SupportProps {
  readonly invert?: boolean;
}

const ProjectHeader = ({ project }: { readonly project?: IProject } & SupportProps) => (
  <Flex sx={style.projectHeader}>
    <Flex sx={{ variant: "header.left" }}>
      <Link
        to="/"
        sx={{
          lineHeight: "0",
          borderRadius: "small",
          "&:focus": { outline: "none", boxShadow: "focus" }
        }}
      >
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
    <Flex sx={{ variant: "header.right" }}>
      <ShareMenu invert={true} />
      <SupportMenu invert={true} />
    </Flex>
  </Flex>
);

export default ProjectHeader;
