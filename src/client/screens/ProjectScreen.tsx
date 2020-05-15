/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { Link, Redirect, useParams } from "react-router-dom";
import { Box, Flex, Image, jsx } from "theme-ui";
import { IUser } from "../../shared/entities";
import { getTestString } from "../../shared/TestFns";
import { userFetch } from "../actions/user";
import "../App.css";
import CenteredContent from "../components/CenteredContent";
import Map from "../components/Map";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly user: Resource<IUser>;
}

const ProjectScreen = ({ user }: StateProps) => {
  useEffect(() => {
    store.dispatch(userFetch());
  }, []);

  const { projectId } = useParams();
  return "isPending" in user ? (
    <CenteredContent>Loading...</CenteredContent>
  ) : "errorMessage" in user ? (
    <Redirect to={"/login"} />
  ) : (
    <Flex sx={{ textAlign: "center", flexDirection: "column", height: "100%" }}>
      <Flex
        as="header"
        sx={{
          backgroundColor: "accent",
          minHeight: "30vh",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 3,
          verticalAlign: "middle"
        }}
      >
        <Link to="/">
          <Image src={process.env.PUBLIC_URL + "/logo.png"} alt="logo" sx={{ p: 3 }} />
        </Link>
        DistrictBuilder
        <br />
        Test code sharing: {getTestString()}
        <br />
        User: {"resource" in user ? user.resource.email : "none"}
        <br />
        Project id: {projectId}
      </Flex>
      <Box as="main" sx={{ flex: "auto" }}>
        <Map />
      </Box>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
