import React from "react";
import { BrowserRouter as Router, Redirect, Route, RouteProps, Switch } from "react-router-dom";

import { getJWT, jwtIsExpired } from "./jwt";
import ActivateAccountScreen from "./screens/ActivateAccountScreen";
import CreateProjectScreen from "./screens/CreateProjectScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProjectScreen from "./screens/ProjectScreen";
import RegistrationScreen from "./screens/RegistrationScreen";

import "./App.css";

const PrivateRoute = ({ component, ...props }: RouteProps) => {
  const savedJWT = getJWT();
  return !savedJWT || jwtIsExpired(savedJWT) ? (
    <Redirect to="/login" />
  ) : (
    <Route component={component} {...props} />
  );
};

const App = () => (
  <div className="App">
    <Router>
      <Switch>
        <Route path="/" exact={true} component={HomeScreen} />
        <PrivateRoute path="/projects/:projectId" exact={true} component={ProjectScreen} />
        <Route path="/login" exact={true} component={LoginScreen} />
        <Route path="/register" exact={true} component={RegistrationScreen} />
        <Route path="/activate/:token" exact={true} component={ActivateAccountScreen} />
        <PrivateRoute path="/create-project" exact={true} component={CreateProjectScreen} />
      </Switch>
    </Router>
  </div>
);

export default App;
