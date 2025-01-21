import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import LeadGenerator from './components/LeadGenerator';
import './App.css';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <LeadGenerator />
      </div>
    </ThemeProvider>
  );
}

export default App;
