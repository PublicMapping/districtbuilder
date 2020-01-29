import React, { useEffect } from "react";
import { connect } from "react-redux";
import { getTestString } from "../shared/TestFns";
import { usersFetch, UsersResource } from "./actions/users";
import "./App.css";
import Map from "./components/Map";
import { State } from "./reducers";
import store from "./store";
import { Resource } from "./types";

interface StateProps {
  readonly users: Resource<UsersResource>;
}

type Props = StateProps;

const App = ({ users }: Props) => {
  useEffect(() => {
    store.dispatch(usersFetch());
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src="logo.png" className="App-logo" alt="logo" />
        DistrictBuilder 2
        <br />
        Test code sharing: {getTestString()}
        <br />
        Users: {"resource" in users ? users.resource.map(u => u.email).join(",") : "none"}
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

export default connect(mapStateToProps)(App);
