import React from 'react'
import { render } from "react-dom";
import App from './App.jsx'
import './index.css'
import { ChakraProvider } from "@chakra-ui/react"

const container = document.getElementById("root");

render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
  container
);

