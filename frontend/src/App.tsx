import { Box } from "@mui/material";
import Header from "./components/Header";
import "./App.css";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
        <Header title="Gestão de produtos"></Header>
      
      
        <Footer />
      </Box>
    </>
  );
}

export default App;
