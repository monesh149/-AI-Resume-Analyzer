import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScoreChart from "../components/ScoreChart";
import { loadHistory } from "../utils/history";
import "./History.css";

function History({ showToast }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const metrics = useMemo(() => {
    if (!history.length) {
      return { count: 0, average: 0, best: 0, totalSkills: 0 };
    }

    return {
      count: history.length,
      average: Math.round(history.reduce((sum, item) => sum + (item.atsScore || 0), 0) / history.length),
      best: Math.max(...history.map((item) => item.atsScore || 0)),
      totalSkills: history.reduce((sum, item) => sum + (item.skills?.total || 0), 0),
    };
  }, [history]);

  const clearHistory = () => {
    if (!window.confirm("Clear all saved analysis history?")) {
      return;
    }

    localStorage.removeItem("analysisHistory");
    localStorage.removeItem("selectedAnalysisId");
    setHistory([]);
    showToast("Saved history cleared.", "success");
  };

  const deleteItem = (id) => {
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem("analysisHistory", JSON.stringify(updated));
    setHistory(updated);
    showToast("Analysis removed from history.", "success");
  };

  if (!history.length) {
    return (
      <div className="page-shell history-page">
        <div className="page-inner">
          <section className="history-empty glass-card fade-rise">
            <span className="section-kicker">
              <span className="dot" />
              Local history
            </span>
            <h1>No saved analyses yet</h1>
            <p>Your completed resume checks will appear here so you can compare revisions and reopen results later.</p>
            <button type="button" className="btn-primary" onClick={() => navigate("/upload")}>
              Analyze your first resume
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell history-page">
      <div className="page-inner history-stack">
        <section className="history-hero glass-card fade-rise">
          <div>
            <span className="section-kicker">
              <span className="dot" />
              Revision timeline
            </span>
            <h1>Track resume quality over time and jump back into any saved analysis.</h1>
            <p>Your history is stored locally in the browser, making it quick to revisit earlier drafts and compare progress.</p>
          </div>
          <div className="history-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/upload")}>
              New analysis
            </button>
            <button type="button" className="btn-danger" onClick={clearHistory}>
              Clear all
            </button>
          </div>
        </section>

        <section className="history-metrics fade-rise stagger-1">
          <div className="metric-card">
            <div className="metric-label">Total analyses</div>
            <div className="metric-value">{metrics.count}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Average ATS</div>
            <div className="metric-value">{metrics.average}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Best score</div>
            <div className="metric-value">{metrics.best}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Skills detected</div>
            <div className="metric-value">{metrics.totalSkills}</div>
          </div>
        </section>

        <section className="history-list">
          {history.map((item, index) => (
            <article key={item.id || `${item.fileName}-${index}`} className={`history-card glass-card fade-rise stagger-${Math.min(index + 1, 4)}`}>
              <div className="history-card-score">
                <ScoreChart score={item.atsScore || 0} size={92} label="" />
              </div>

              <div className="history-card-main">
                <div className="history-card-top">
                  <div>
                    <h3>{item.fileName}</h3>
                    <p>
                      {new Date(item.timestamp || Date.now()).toLocaleDateString()} at{" "}
                      {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`status-pill ${item.atsScore >= 80 ? "status-good" : item.atsScore >= 60 ? "status-mid" : "status-bad"}`}>
                    {item.atsScore || 0}% ATS
                  </span>
                </div>

                <div className="history-detail-grid">
                  <div><span>Skills</span><strong>{item.skills?.total || 0}</strong></div>
                  <div><span>Words</span><strong>{item.wordCount?.toLocaleString() || 0}</strong></div>
                  <div><span>Education</span><strong>{item.educationLevel || "Unknown"}</strong></div>
                  <div><span>Role match</span><strong>{item.jobMatch?.matchScore || 0}%</strong></div>
                </div>
              </div>

              <div className="history-card-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    localStorage.setItem("selectedAnalysisId", item.id);
                    navigate("/analysis");
                  }}
                >
                  Open
                </button>
                <button type="button" className="btn-danger" onClick={() => deleteItem(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default History;
