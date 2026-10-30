
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";

import Home from "./pages/home";
import About from "./pages/about";
import HowItWorks from "./pages/howitworks";
import Features from "./pages/features";

import Login from "./pages/login";
import Signup from "./pages/signup";

import Explore from "./pages/app/explore";
import Workspace from "./pages/app/workspace";
import Discoveries from "./pages/app/discoveries";
import Reports from "./pages/app/reports";
import Settings from "./pages/app/settings";

import CodeIntelligence from "./pages/app/code-intelligence";
import AgentNetwork from "./pages/app/agent-network";

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
        {/* PUBLIC WEBSITE */}
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

        {/* AUTHENTICATION */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* INVESTIGATION APPLICATION */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Explore />} />
          <Route path="explore" element={<Explore />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="discoveries" element={<Discoveries />} />
          <Route path="reports" element={<Reports />} />
          <Route path="agent-network" element={<AgentNetwork />} />
          <Route
            path="code-intelligence"
            element={<CodeIntelligence />}
          />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
