import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";
import ProjectScreen from "./screens/ProjectScreen";

import "./App.css";

const App = () => (
  <div className="App">
    <Router>
      <Switch>
        <Route path="/" exact={true} component={HomeScreen} />
        <Route path="/projects/:projectId" exact={true} component={ProjectScreen} />
      </Switch>
    </Router>
  </div>
);

export default App;
