import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link, Redirect, useParams } from "react-router-dom";
import { IUser } from "../../shared/entities";
import { getTestString } from "../../shared/TestFns";
import { userFetch } from "../actions/user";
import "../App.css";
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
    <span>Loading...</span>
  ) : "errorMessage" in user ? (
    <Redirect to={"/login"} />
  ) : (
    <div className="App">
      <header className="App-header">
        <Link to="/">
          <img src={process.env.PUBLIC_URL + "/logo.png"} className="App-logo" alt="logo" />
        </Link>
        DistrictBuilder 2
        <br />
        Test code sharing: {getTestString()}
        <br />
        User: {"resource" in user ? user.resource.email : "none"}
        <br />
        Project id: {projectId}
      </header>
      <main>
        <Map />
      </main>
    </div>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(ProjectScreen);
