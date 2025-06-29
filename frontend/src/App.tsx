import "./App.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar/Navbar"
import ExpertDash from "./pages/Expert Dashboard/ExpertDash"
import MainPage from "./pages/Main Page/MainPage"

// Home component that shows Navbar and Posts
function Home() {
  return (
    <>
      <Navbar />
      <MainPage/>
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Home route - shows Navbar and Posts */}
        <Route path="/" element={<Home />} />

        {/* Expert Dashboard route with name parameter */}
        <Route path="/ExpertDash/:name" element={<ExpertDash />} />

        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App
