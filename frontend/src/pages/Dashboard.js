import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadHistory } from "../utils/history";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        count: 0,
        average: 0,
        best: 0,
        topSkills: 0,
      };
    }

    return {
      count: history.length,
      average: Math.round(history.reduce((sum, item) => sum + (item.atsScore || 0), 0) / history.length),
      best: Math.max(...history.map((item) => item.atsScore || 0)),
      topSkills: Math.max(...history.map((item) => item.skills?.total || 0)),
    };
  }, [history]);

  const features = [
    {
      title: "Fast resume diagnostics",
      copy: "Upload once and get structure, keyword, and ATS feedback within seconds.",
    },
    {
      title: "Job-match awareness",
      copy: "Paste a role description to see missing skills and how closely your resume aligns.",
    },
    {
      title: "Clearer revision loops",
      copy: "Track score changes over time and quickly spot what improved between versions.",
    },
    {
      title: "Decision-ready reporting",
      copy: "Turn raw resume text into sections, charts, skills, and actionable next steps.",
    },
  ];

  const steps = [
    { index: "01", title: "Upload your latest resume", copy: "Use PDF, DOCX, DOC, or TXT and let the analyzer read the structure." },
    { index: "02", title: "Add a target role", copy: "Drop in a job description to compare your experience against the posting." },
    { index: "03", title: "Improve what matters", copy: "Use score signals, missing skills, and section feedback to sharpen the next draft." },
  ];

  return (
    <div className="page-shell dashboard-page">
      <div className="page-inner">
        <section className="dashboard-hero glass-card fade-rise">
          <div className="dashboard-hero-copy">
            <span className="section-kicker">
              <span className="dot" />
              Resume intelligence studio
            </span>

            <h1>
              Turn every resume draft into a sharper,
              <span> more interview-ready story.</span>
            </h1>

            <p>
              This workspace helps you review ATS strength, align to target roles, and polish the parts recruiters scan first.
            </p>

            <div className="dashboard-actions">
              <button type="button" className="btn-primary" onClick={() => navigate("/upload")}>
                Start new analysis
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate("/history")}>
                Open history
              </button>
            </div>

            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Analyses saved</div>
                <div className="metric-value">{stats.count}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Average ATS</div>
                <div className="metric-value">{stats.average}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Best score</div>
                <div className="metric-value">{stats.best}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Highest skill count</div>
                <div className="metric-value">{stats.topSkills}</div>
              </div>
            </div>
          </div>

          <div className="dashboard-hero-panel">
            <div className="hero-panel-card hero-main-card fade-rise stagger-1">
              <div className="hero-card-top">
                <span className="hero-chip hero-chip-accent">Live readiness</span>
                <span className="hero-badge-score">{stats.average || 72}%</span>
              </div>
              <h3>Recruiter-first feedback</h3>
              <p>See whether your headline, skills, and core sections are carrying enough signal for ATS filters.</p>
              <div className="hero-progress">
                <span style={{ width: `${Math.max(stats.average, 28)}%` }} />
              </div>
            </div>

            <div className="hero-floating-grid">
              <div className="hero-panel-card fade-rise stagger-2">
                <span className="hero-chip hero-chip-info">Role match</span>
                <strong>{stats.best || 84}%</strong>
                <p>Best observed ATS score from your saved runs.</p>
              </div>
              <div className="hero-panel-card fade-rise stagger-3">
                <span className="hero-chip hero-chip-success">Revision flow</span>
                <strong>{history.length ? "Active" : "Ready"}</strong>
                <p>{history.length ? "You already have resumes to compare." : "Upload your first resume to start tracking growth."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-head fade-rise">
            <div>
              <span className="section-kicker">
                <span className="dot" />
                Product strengths
              </span>
              <h2>Built to make resume feedback easier to act on</h2>
            </div>
          </div>

          <div className="dashboard-feature-grid">
            {features.map((feature, index) => (
              <article key={feature.title} className={`dashboard-feature-card glass-card fade-rise stagger-${Math.min(index + 1, 4)}`}>
                <span className="feature-index">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-steps glass-card fade-rise">
            <div className="dashboard-steps-copy">
              <span className="section-kicker">
                <span className="dot" />
                Workflow
              </span>
              <h2>A cleaner path from upload to rewrite</h2>
              <p>Keep the process focused: diagnose the draft, compare it against the role, then revise only the gaps that matter.</p>
            </div>

            <div className="dashboard-step-list">
              {steps.map((step, index) => (
                <div key={step.index} className={`dashboard-step fade-rise stagger-${Math.min(index + 1, 4)}`}>
                  <div className="dashboard-step-index">{step.index}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
