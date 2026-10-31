import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";

import Home from "./pages/home";
import About from "./pages/about";
import HowItWorks from "./pages/howitworks";
import Features from "./pages/features";

import Login from "./pages/login";
import Signup from "./pages/signup";

import Workspace from "./pages/app/workspace";
import Explore from "./pages/app/explore";
import AgenticNetwork from "./pages/app/network";
import FunnelAnalysis from "./pages/app/funnels";
import ChallengeSolver from "./pages/app/challenge";
import Discoveries from "./pages/app/discoveries";
import Reports from "./pages/app/reports";
import Debug from "./pages/app/debug";
import Settings from "./pages/app/settings";

import AppLayout from "./layouts/applayout";

import "./App.css";

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC MARKETING & AUTH PAGES */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />
        <Route
          path="/how-it-works"
          element={
            <PublicLayout>
              <HowItWorks />
            </PublicLayout>
          }
        />
        <Route
          path="/features"
          element={
            <PublicLayout>
              <Features />
            </PublicLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* AUTONOMOUS INVESTIGATION APPLICATION DASHBOARD */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Workspace />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="explore" element={<Explore />} />
          <Route path="network" element={<AgenticNetwork />} />
          <Route path="funnels" element={<FunnelAnalysis />} />
          <Route path="challenge" element={<ChallengeSolver />} />
          <Route path="discoveries" element={<Discoveries />} />
          <Route path="reports" element={<Reports />} />
          <Route path="debug" element={<Debug />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
