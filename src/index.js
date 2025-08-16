import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import "./css/index.css";
import DocumentView from "./view/DocumentView.js";
import LoginView from "./view/LoginView.js";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<LoginView/>}/>
                <Route path="/main" element={<DocumentView/>}/>
            </Routes>
        </Router>
    </React.StrictMode>
);