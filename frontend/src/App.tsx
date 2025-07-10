import "./App.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar/Navbar"
import ExpertDash from "./pages/Expert Dashboard/ExpertDash"
import MainPage from "./pages/Main Page/MainPage"
import AboutUs from "./pages/About Us/AboutUs"
import RequestForm from "./pages/Request Form/RequestForm"
import Login from "./pages/Login/Login"
import UserSettings from "./pages/User Settings Page/UserSettings"
import UserDash from "./pages/User Dashboard/UserDash"
import AdminDash from "./pages/Admin Dashboard/AdminDash"
import AdminLogin from "./pages/Admin Login/AdminLogin"

// Components
function Home() {
  return (
    <>
      <Navbar />
      <MainPage/>
    </>
  )
}

function Aboutus(){
  return (
    <>
    <Navbar />
    <AboutUs/>
    </>
  )
}

function ReqForm(){
  return (
    <>
    <Navbar />
    <RequestForm/>
    </>
  )
}

function LogIN(){
  return (
    <>
    <Navbar />
    <Login/>
    </>
  )
}

function Usersettings(){
  return (
    <>
    <Navbar />
    <UserSettings/>
    </>
  )
}

function Userdash(){
  return (
    <>
    <Navbar />
    <UserDash/>
    </>
  )
}

function AdminDashboard(){
  return (
    <>
    <AdminDash/>
    </>
  )
}

function AdminLoginPage(){
  return (
    <>
    <AdminLogin/>
    </>
  )
}


function App() {
  return (
    <Router>
      <Routes>
        {/* Routes shows Navbar And Other Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<Aboutus />} />
        <Route path="/RequestForm" element={<ReqForm />} />
        <Route path="/login" element={<LogIN />} />
        <Route path="/UserSettings" element={<Usersettings />} />
        <Route path="/UserDash" element={<Userdash />} />

        {/* Admin routes */}
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Expert Dashboard route with name parameter */}
        <Route path="/ExpertDash/:name" element={<ExpertDash />} />

        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App
