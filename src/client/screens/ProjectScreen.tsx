import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { getTestString } from "../../shared/TestFns";
import { usersFetch, UsersResource } from "../actions/users";
import "../App.css";
import Map from "../components/Map";
import { State } from "../reducers";
import store from "../store";
import { Resource } from "../types";

interface StateProps {
  readonly users: Resource<UsersResource>;
}

const ProjectScreen = ({ users }: StateProps) => {
  useEffect(() => {
    store.dispatch(usersFetch());
  }, []);

  const { projectId } = useParams();
  return (
    <div className="App">
      <header className="App-header">
        <Link to="/">
          <img src={process.env.PUBLIC_URL + "/logo.png"} className="App-logo" alt="logo" />
        </Link>
        DistrictBuilder 2
        <br />
        Test code sharing: {getTestString()}
        <br />
        Users:{" "}
        {"resource" in users && users.resource.length
          ? users.resource.map(u => u.email).join(",")
          : "none"}
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
    users: state.users
  };
}

export default connect(mapStateToProps)(ProjectScreen);
