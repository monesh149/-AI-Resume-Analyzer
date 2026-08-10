import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../utils/api";
import ScoreChart from "../components/ScoreChart";
import "./UploadResume.css";

function UploadResume({ showToast }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const scoreMeta = (score) => {
    if (score >= 80) return { text: "Excellent", className: "status-pill status-good" };
    if (score >= 60) return { text: "Promising", className: "status-pill status-mid" };
    return { text: "Needs work", className: "status-pill status-bad" };
  };

  const getFileTypeLabel = (mimetype) => {
    if (mimetype === "application/pdf") return "PDF";
    if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
    if (mimetype === "text/plain") return "TXT";
    return "Unknown";
  };

  const handlePickedFile = useCallback(
    (pickedFile) => {
      if (!pickedFile) {
        return;
      }

      const ext = pickedFile.name.toLowerCase().split(".").pop();
      if (!["pdf", "docx", "txt"].includes(ext)) {
        showToast("Only PDF, DOCX, and TXT files are allowed.", "error");
        return;
      }

      setFile(pickedFile);
      showToast("Resume selected and ready for analysis.", "success");
    },
    [showToast]
  );

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      handlePickedFile(event.dataTransfer.files[0]);
    },
    [handlePickedFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file || loading) {
      if (!file) {
        showToast("Choose a resume file before starting analysis.", "warning");
      }
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    let intervalId;

    try {
      setLoading(true);
      setProgress(8);

      intervalId = setInterval(() => {
        setProgress((current) => (current >= 88 ? current : current + Math.random() * 12));
      }, 240);

      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const enriched = {
        ...response.data,
        id: response.data.id || `analysis-${Date.now()}`,
        timestamp: response.data.timestamp || new Date().toISOString(),
      };

      setResult(enriched);
      setProgress(100);

      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      const updated = [enriched, ...history.filter((item) => item.id !== enriched.id)].slice(0, 50);
      localStorage.setItem("analysisHistory", JSON.stringify(updated));
      localStorage.setItem("selectedAnalysisId", enriched.id);

      showToast("Resume analyzed successfully.", "success");

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 280);
    } catch (error) {
      showToast(error.response?.data?.message || "There was a problem uploading your resume.", "error");
      setProgress(0);
    } finally {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setLoading(false);
    }
  }, [file, jobDescription, loading, showToast]);

  const resetAll = () => {
    setFile(null);
    setResult(null);
    setJobDescription("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const keyboardHandler = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        fileInputRef.current?.click();
      }

      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleUpload();
      }
    };

    window.addEventListener("keydown", keyboardHandler);
    return () => window.removeEventListener("keydown", keyboardHandler);
  }, [handleUpload]);

  return (
    <div className="page-shell upload-page">
      <div className="page-inner">
        <section className="upload-hero glass-card fade-rise">
          <div>
            <span className="section-kicker">
              <span className="dot" />
              Upload workspace
            </span>
            <h1>Run a deeper resume check with cleaner signals and smoother feedback.</h1>
            <p>Drop your resume, optionally add a job description, and review ATS, skill coverage, and revision guidance in one flow.</p>
          </div>
          <div className="upload-shortcuts">
            <div className="upload-shortcut-card">
              <strong>Ctrl + U</strong>
              <span>Pick a file</span>
            </div>
            <div className="upload-shortcut-card">
              <strong>Ctrl + Enter</strong>
              <span>Analyze instantly</span>
            </div>
          </div>
        </section>

        <section className="upload-layout">
          <div className="upload-column-main">
            <div
              className={`upload-dropzone glass-card ${dragActive ? "drag-active" : ""} ${file ? "file-selected" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!file) {
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => handlePickedFile(event.target.files[0])}
                hidden
              />

              <div className="upload-dropzone-orb" />
              {loading ? <div className="upload-progress-line" style={{ width: `${progress}%` }} /> : null}

              {!file ? (
                <div className="upload-dropzone-copy">
                  <div className="upload-file-mark">CV</div>
                  <h2>{dragActive ? "Drop the resume here" : "Drag, drop, and start improving"}</h2>
                  <p>Supports PDF, DOCX, DOC, and TXT. The analysis focuses on ATS readability, section coverage, and role match.</p>
                </div>
              ) : (
                <div className="upload-selected-file">
                  <div className="upload-file-badge">Ready</div>
                  <div>
                    <h2>{file.name}</h2>
                    <p>{(file.size / 1024).toFixed(1)} KB loaded for analysis</p>
                  </div>
                  <button type="button" className="btn-danger" onClick={(event) => {
                    event.stopPropagation();
                    resetAll();
                  }}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="upload-input-card glass-card">
              <div className="upload-card-head">
                <div>
                  <h3>Target role context</h3>
                  <p>Optional, but helpful for missing-skill and role-match scoring.</p>
                </div>
                <span className="status-pill status-good">Optional</span>
              </div>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste a job description here to compare the resume against a specific role."
              />

              <div className="upload-actions">
                {result ? (
                  <button type="button" className="btn-secondary" onClick={resetAll}>
                    Analyze another resume
                  </button>
                ) : null}
                <button type="button" className="btn-primary" onClick={handleUpload} disabled={loading || !file}>
                  {loading ? "Analyzing..." : "Analyze resume"}
                </button>
              </div>
            </div>
          </div>

          <aside className="upload-column-side">
            <div className="upload-side-card glass-card">
              <span className="section-kicker">
                <span className="dot" />
                What you get
              </span>
              <ul>
                <li>ATS score and resume quality signal</li>
                <li>Job-match score when a role is supplied</li>
                <li>Detected skills, missing skills, and section checks</li>
                <li>Actionable suggestions for the next revision</li>
              </ul>
            </div>

            {loading ? (
              <div className="upload-side-card glass-card upload-loading-card">
                <div className="upload-loader" />
                <h3>Analyzing your resume</h3>
                <p>
                  {progress < 35
                    ? "Reading the document structure."
                    : progress < 65
                      ? "Extracting sections and skills."
                      : progress < 90
                        ? "Comparing content and generating guidance."
                        : "Finalizing the score and summary."}
                </p>
              </div>
            ) : null}
          </aside>
        </section>

        {result && !loading ? (
          <section ref={resultRef} className="upload-results fade-rise">
            <div className="upload-results-head">
              <div>
                <span className="section-kicker">
                  <span className="dot" />
                  Analysis result
                </span>
                <h2>Your resume review is ready</h2>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  localStorage.setItem("selectedAnalysisId", result.id);
                  navigate("/analysis");
                }}
              >
                Open detailed analysis
              </button>
            </div>

            <div className="upload-score-grid">
              <article className="glass-card upload-score-card">
                <ScoreChart score={result.atsScore || 0} label="ATS score" size={170} />
                <span className={scoreMeta(result.atsScore || 0).className}>{scoreMeta(result.atsScore || 0).text}</span>
              </article>

              {result.jobMatch?.jobSkills?.length ? (
                <article className="glass-card upload-score-card">
                  <ScoreChart score={result.jobMatch.matchScore || 0} label="Job match" size={170} color="#0ea5e9" />
                  <span className={scoreMeta(result.jobMatch.matchScore || 0).className}>{scoreMeta(result.jobMatch.matchScore || 0).text}</span>
                </article>
              ) : null}

              <article className="glass-card upload-info-card">
                <h3>Resume summary</h3>
                <div className="upload-info-list">
                  <div><span>File</span><strong>{result.fileName || file?.name}</strong></div>
                  <div><span>Document type</span><strong>{getFileTypeLabel(result.fileType)}</strong></div>
                  <div><span>Words</span><strong>{result.metrics?.wordCount?.toLocaleString() || 0}</strong></div>
                  <div><span>Readability</span><strong>{result.readabilityCategory || "Unknown"}</strong></div>
                  <div><span>Skills found</span><strong>{result.skills?.total || 0}</strong></div>
                  <div><span>Education</span><strong>{result.educationLevel || "Not detected"}</strong></div>
                </div>
              </article>
            </div>

            <div className="upload-results-grid">
              {result.skills?.found?.length ? (
                <article className="glass-card upload-result-panel">
                  <div className="upload-panel-head">
                    <h3>Skills found</h3>
                    <span className="status-pill status-good">{result.skills.found.length}</span>
                  </div>
                  <div className="tag-list">
                    {result.skills.found.map((skill) => (
                      <span key={skill} className="tag tag-success">{skill}</span>
                    ))}
                  </div>
                </article>
              ) : null}

              {result.jobMatch?.missingSkills?.length ? (
                <article className="glass-card upload-result-panel">
                  <div className="upload-panel-head">
                    <h3>Missing skills</h3>
                    <span className="status-pill status-bad">{result.jobMatch.missingSkills.length}</span>
                  </div>
                  <div className="tag-list">
                    {result.jobMatch.missingSkills.map((skill) => (
                      <span key={skill} className="tag tag-danger">{skill}</span>
                    ))}
                  </div>
                </article>
              ) : null}

              {result.categoryCounts ? (
                <article className="glass-card upload-result-panel">
                  <div className="upload-panel-head">
                    <h3>Skills by category</h3>
                    <span className="status-pill status-mid">{Object.keys(result.categoryCounts).length}</span>
                  </div>
                  <div className="upload-category-grid">
                    {Object.entries(result.categoryCounts).map(([category, count]) => (
                      <div key={category} className="upload-category-item">
                        <strong>{count}</strong>
                        <span>{category}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            {result.suggestions?.length ? (
              <article className="glass-card upload-suggestions">
                <h3>Improvement suggestions</h3>
                <div className="suggestion-list">
                  {result.suggestions.map((item, index) => (
                    <div key={`${item.text || item}-${index}`} className="suggestion-item">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{item?.text ?? String(item)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {result.sections ? (
              <article className="glass-card upload-sections">
                <h3>Section checklist</h3>
                <div className="section-check-grid">
                  {Object.entries(result.sections).map(([key, value]) => {
                    const labels = {
                      hasContact: "Contact info",
                      hasProjects: "Projects",
                      hasExperience: "Experience",
                      hasEducation: "Education",
                      hasSkills: "Skills",
                    };

                    return (
                      <div key={key} className={`section-check-item ${value ? "present" : "missing"}`}>
                        <strong>{value ? "Yes" : "No"}</strong>
                        <span>{labels[key] || key}</span>
                      </div>
                    );
                  })}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default UploadResume;
