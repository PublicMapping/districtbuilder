import React from "react";
import { Link } from "react-router-dom";

const HomeScreen = () => (
  <div>
    <span>Home screen</span>
    <br />
    <br />
    <Link to="/projects/123abc">Project 123abc</Link>
    <br />
    <br />
    <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
  </div>
);

export default HomeScreen;
