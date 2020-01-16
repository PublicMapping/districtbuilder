import React from "react";

import "./App.css";
import Map from "./components/Map";

const App = () => (
  <div className="App">
    <header className="App-header">
      <img src="logo.png" className="App-logo" alt="logo" />
      DistrictBuilder 2
    </header>
    <main>
      <Map />
    </main>
  </div>
);

export default App;
