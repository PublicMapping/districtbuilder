import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { projectsFetch } from "../actions/projects";
import { State } from "../reducers";
import { ProjectsState } from "../reducers/projects";
import store from "../store";

interface StateProps {
  readonly projects: ProjectsState;
}

const HomeScreen = ({ projects }: StateProps) => {
  useEffect(() => {
    store.dispatch(projectsFetch());
  }, []);

  return (
    <div>
      <span>Home screen</span>
      <br />
      <br />
      {"resource" in projects ? (
        projects.resource.length ? (
          <ul>
            {projects.resource.map(project => (
              <li key={project.id}>
                <Link to={`/projects/${project.id}`}>{project.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <div>No projects found</div>
        )
      ) : null}
      <br />
      <Link to="/create-project">Create project</Link>
      <br />
      <br />
      <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
    </div>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects
  };
}

export default connect(mapStateToProps)(HomeScreen);
