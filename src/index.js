import React from "react";
import ReactDOM from "react-dom/client";
import "./css/index.css";
import DocumentView from "./view/DocumentView.js";
import LoginView from "./view/LoginView.js";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        {/*<LoginView/>*/}
        <DocumentView/>
    </React.StrictMode>
);