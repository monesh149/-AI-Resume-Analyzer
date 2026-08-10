import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import UploadResume from "./pages/UploadResume";
import Analysis from "./pages/Analysis";
import History from "./pages/History";
import Toast from "./components/Toast";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="app-shell">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="app-main-wrap">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <span />
              <span />
              <span />
            </button>

            <main className="app-main">
              <Routes>
                <Route path="/" element={<Dashboard showToast={showToast} />} />
                <Route path="/upload" element={<UploadResume showToast={showToast} />} />
                <Route path="/analysis" element={<Analysis showToast={showToast} />} />
                <Route path="/history" element={<History showToast={showToast} />} />
              </Routes>
            </main>
          </div>

          {toast && (
            <Toast
              key={toast.key}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
