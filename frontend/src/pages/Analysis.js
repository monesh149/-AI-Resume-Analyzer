import React, { useEffect, useMemo, useState } from "react";
import {
  Doughnut,
  Bar,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import API_BASE from "../utils/api";
import ScoreChart from "../components/ScoreChart";
import { loadHistory } from "../utils/history";
import "./Analysis.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CATEGORY_COLORS = ["#f97316", "#0ea5e9", "#14b8a6", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#22c55e"];

function Analysis({ showToast }) {
  const [skills, setSkills] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    const history = loadHistory();
    const selectedId = localStorage.getItem("selectedAnalysisId");
    const fallback = history[0] || null;
    const resolved = history.find((item) => item.id === selectedId) || fallback;
    setSelectedAnalysis(resolved);
  }, []);

  const fetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await fetch(`${API_BASE}/skills`);
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error(error);
      showToast?.("Unable to load the skill database right now.", "error");
    } finally {
      setLoadingSkills(false);
    }
  };

  const chartData = useMemo(() => {
    if (!skills) {
      return null;
    }

    const categories = Object.keys(skills.categories);
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map((category) => skills.categories[category].length),
          backgroundColor: CATEGORY_COLORS.slice(0, categories.length),
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    };
  }, [skills]);

  const pieData = useMemo(() => {
    if (!skills) {
      return null;
    }

    const categories = Object.keys(skills.categories);
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map((category) => skills.categories[category].length),
          backgroundColor: CATEGORY_COLORS.slice(0, categories.length),
          borderWidth: 0,
        },
      ],
    };
  }, [skills]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.15)" },
        ticks: { color: "#7c879c" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#7c879c" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 18,
          color: "#7c879c",
        },
      },
    },
  };

  return (
    <div className="page-shell analysis-page">
      <div className="page-inner analysis-stack">
        <section className="analysis-hero glass-card fade-rise">
          <div>
            <span className="section-kicker">
              <span className="dot" />
              Analysis center
            </span>
            <h1>Review one saved resume in detail, then explore the wider skills database.</h1>
            <p>The analysis page now combines your selected result with the broader skill categories used by the analyzer.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={fetchSkills} disabled={loadingSkills}>
            {loadingSkills ? "Loading skill database..." : skills ? "Refresh skill database" : "Load skill database"}
          </button>
        </section>

        {selectedAnalysis ? (
          <section className="analysis-selected glass-card fade-rise stagger-1">
            <div className="analysis-selected-head">
              <div>
                <h2>Selected resume snapshot</h2>
                <p>{selectedAnalysis.fileName}</p>
              </div>
              <span className="status-pill status-good">
                {new Date(selectedAnalysis.timestamp || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <div className="analysis-selected-grid">
              <article className="analysis-score-panel">
                <ScoreChart score={selectedAnalysis.atsScore || 0} label="ATS score" size={170} />
              </article>

              <article className="analysis-summary-panel">
                <div className="analysis-mini-grid">
                  <div className="metric-card">
                    <div className="metric-label">Words</div>
                    <div className="metric-value">{selectedAnalysis.metrics?.wordCount?.toLocaleString() || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Skills found</div>
                    <div className="metric-value">{selectedAnalysis.skills?.total || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Readability</div>
                    <div className="metric-value analysis-small-metric">{selectedAnalysis.readabilityCategory || "Unknown"}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Education</div>
                    <div className="metric-value analysis-small-metric">{selectedAnalysis.educationLevel || "Unknown"}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Role match</div>
                    <div className="metric-value">{selectedAnalysis.jobMatch?.matchScore || 0}%</div>
                  </div>
                </div>
              </article>

              <article className="analysis-tag-panel">
                <div className="analysis-panel-head">
                  <h3>Detected skills</h3>
                  <span className="status-pill status-good">{selectedAnalysis.skills?.found?.length || 0}</span>
                </div>
                {selectedAnalysis.categoryCounts ? (
                  <div className="analysis-category-summary">
                    <span className="category-summary-label">Skills by category:</span>
                    <div className="category-summary-list">
                      {Object.entries(selectedAnalysis.categoryCounts).map(([category, count]) => (
                        <span key={category} className="tag tag-success">
                          {category}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="tag-list">
                  {(selectedAnalysis.skills?.found || []).slice(0, 18).map((skill) => (
                    <span key={skill} className="tag tag-success">{skill}</span>
                  ))}
                </div>
              </article>
            </div>

            {selectedAnalysis.suggestions?.length ? (
              <div className="analysis-suggestion-list">
                {selectedAnalysis.suggestions.map((item, index) => (
                  <div key={`${item.text || item}-${index}`} className="analysis-suggestion-item">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{item?.text ?? String(item)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="glass-card analysis-empty fade-rise stagger-1">
            <h2>No saved analysis selected yet</h2>
            <p>Analyze a resume or open one from history to see its detailed breakdown here.</p>
          </section>
        )}

        {skills ? (
          <>
            <section className="analysis-summary-bar fade-rise stagger-2">
              <div className="metric-card">
                <div className="metric-label">Tracked skills</div>
                <div className="metric-value">{skills.totalSkills}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Categories</div>
                <div className="metric-value">{Object.keys(skills.categories).length}</div>
              </div>
            </section>

            <section className="analysis-chart-grid">
              <article className="glass-card analysis-chart-card fade-rise stagger-3">
                <div className="analysis-panel-head">
                  <h3>Skills by category</h3>
                </div>
                <div className="analysis-chart-wrap">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </article>

              <article className="glass-card analysis-chart-card fade-rise stagger-4">
                <div className="analysis-panel-head">
                  <h3>Category distribution</h3>
                </div>
                <div className="analysis-chart-wrap">
                  <Doughnut data={pieData} options={doughnutOptions} />
                </div>
              </article>
            </section>

            <section className="analysis-category-grid">
              {Object.entries(skills.categories).map(([category, skillList], index) => (
                <article key={category} className="glass-card analysis-category-card fade-rise">
                  <div className="analysis-panel-head">
                    <div className="analysis-category-head">
                      <span
                        className="analysis-color-dot"
                        style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                      />
                      <h3>{category}</h3>
                    </div>
                    <span className="status-pill status-mid">{skillList.length}</span>
                  </div>
                  <div className="tag-list">
                    {skillList.map((skill) => (
                      <span key={skill} className="tag">{skill}</span>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="glass-card analysis-empty fade-rise stagger-2">
            <h2>Skill database is not loaded yet</h2>
            <p>Use the button above to reveal the tracked categories and visual breakdown.</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default Analysis;
