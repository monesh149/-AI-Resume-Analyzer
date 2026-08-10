import React, { useContext, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { loadHistory } from "../utils/history";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const { dark, toggle } = useContext(ThemeContext);

  const history = loadHistory();

  const stats = useMemo(() => {
    if (!history.length) {
      return { total: 0, average: 0, best: 0 };
    }

    return {
      total: history.length,
      average: Math.round(history.reduce((sum, item) => sum + (item.atsScore || 0), 0) / history.length),
      best: Math.max(...history.map((item) => item.atsScore || 0)),
    };
  }, [history]);

  const navItems = [
    { path: "/", short: "DB", label: "Dashboard", hint: "Overview and quick actions" },
    { path: "/upload", short: "UP", label: "Upload Resume", hint: "Analyze your next version" },
    { path: "/analysis", short: "AN", label: "Analysis", hint: "Explore results and skills" },
    { path: "/history", short: "HS", label: "History", hint: "Review past resume checks" },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-mark">RA</div>
          <div>
            <p className="brand-overline">AI Resume Analyzer</p>
            <h1 className="brand-title">Career Studio</h1>
            <p className="brand-copy">Sharper resumes, clearer signals, stronger interviews.</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-label">Workspace</div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="sidebar-link-mark">{item.short}</span>
              <span className="sidebar-link-copy">
                <span className="sidebar-link-title">{item.label}</span>
                <span className="sidebar-link-hint">{item.hint}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-mini-card">
            <div className="sidebar-mini-head">
              <span>Theme</span>
              <button type="button" className="theme-toggle" onClick={toggle}>
                {dark ? "Light mode" : "Dark mode"}
              </button>
            </div>
            <p>{dark ? "High-contrast focus for late sessions." : "Warm editorial tones for daytime review."}</p>
          </div>

          <div className="sidebar-stats-card">
            <div className="sidebar-label">Snapshot</div>
            <div className="sidebar-stat-row">
              <span>Analyses saved</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="sidebar-stat-row">
              <span>Average ATS</span>
              <strong>{stats.average}%</strong>
            </div>
            <div className="sidebar-stat-row">
              <span>Best score</span>
              <strong>{stats.best}%</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
