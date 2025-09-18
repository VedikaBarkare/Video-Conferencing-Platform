import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Authentication from "./pages/Authentication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import VideoMeet from "./pages/VideoMeet.jsx";
import HomeComponent from "./pages/HomeComponent.jsx";
import History from "./pages/history.jsx";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<HomeComponent/>} />
            <Route path="/history" element={<History/>} />
            <Route path="/:url" element={<VideoMeet/>}/>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
