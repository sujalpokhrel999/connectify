import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from './context/AppContext.jsx'
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(

    <BrowserRouter>
  <AppContextProvider>
      <App />
  </AppContextProvider>
    </BrowserRouter>


);
