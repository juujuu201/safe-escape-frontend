import React from "react";
import ReactDOM from "react-dom/client";
import "./css/index.css";
import DocumentView from "./view/documentView.js";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <DocumentView/>
    </React.StrictMode>
);