/** @jsx jsx */
import { Box, Button, Flex, Image, jsx, Text } from "theme-ui";
import { Link } from "react-router-dom";

import { IProject } from "../../shared/entities";
import Icon from "../components/Icon";
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
  <Flex sx={{ variant: "header.app", backgroundColor: "accent" }}>
    <Flex sx={{ variant: "header.left" }}>
      <Link to="/">
        <Image src="/logo-mark-bw.svg" height="28px" width="28px" />
      </Link>
      <HeaderDivider />
      <Flex
        sx={{
          color: "#fff",
          alignItems: "center"
        }}
      >
        <Text>{project ? project.name : "&mdash;"}</Text>
      </Flex>
    </Flex>
    <Flex sx={{ variant: "header.right" }}>
      <Button sx={{ variant: "buttons.minimal" }}>
        <Icon name="search" /> Find
      </Button>
      <Button sx={{ variant: "buttons.minimal" }}>Settings</Button>
      <Button sx={{ variant: "buttons.minimal" }}>Find</Button>
      <HeaderDivider sx={{ opacity: 0 }} />
      <Button sx={{ variant: "buttons.secondary" }}>Evaluate</Button>
    </Flex>
  </Flex>
);

export default ProjectHeader;
