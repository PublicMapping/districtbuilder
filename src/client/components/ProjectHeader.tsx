/** @jsx jsx */
import { Box, Flex, jsx, Text } from "theme-ui";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";
import { UserState } from "../reducers/user";
import * as H from "history";
import { IProject } from "../../shared/entities";
import { heights } from "../theme";
import AvatarMenu from "../components/AvatarMenu";

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

const ProjectHeader = ({
  project,
  user,
  history
}: {
  readonly project?: IProject;
  readonly user: UserState;
  readonly history: H.History;
}) => (
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
    <Flex sx={{ variant: "header.right" }}>
      <AvatarMenu user={user} history={history} />
    </Flex>
  </Flex>
);

export default ProjectHeader;
