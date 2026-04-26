import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./storage.js"; // installs window.storage shim before the app loads
import FacilityDesigner from "./FacilityDesigner.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FacilityDesigner />
  </React.StrictMode>
);
