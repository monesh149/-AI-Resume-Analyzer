const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// History file path
const historyFile = path.join(__dirname, "analysis-history.json");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/msword"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed."));
    }
  }
});

async function extractResumeText(filePath, mimetype) {
  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }

  if (mimetype === "text/plain") {
    return fs.readFileSync(filePath, "utf8");
  }

  if (mimetype === "application/msword") {
    throw new Error("DOC files are not currently supported. Please upload PDF, DOCX, or TXT.");
  }

  throw new Error("Unsupported file type.");
}

function determineEducationLevel(text) {
  const lower = text.toLowerCase();
  if (/phd|doctoral|doctor of philosophy/.test(lower)) return "PhD";
  if (/master|m\.s\.|m\.a\.|m\.tech|m\.eng|mba/.test(lower)) return "Master's";
  if (/bachelor|b\.s\.|b\.a\.|b\.tech|b\.eng/.test(lower)) return "Bachelor's";
  if (/associate|a\.a\.|a\.s\./.test(lower)) return "Associate";
  if (/diploma|certificate|certified/.test(lower)) return "Certificate";
  return "Not detected";
}

function getReadabilityCategory(score) {
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 45) return "Fair";
  return "Needs simpler phrasing";
}

function buildCategoryCounts(skillCategories) {
  return Object.fromEntries(
    Object.entries(skillCategories).map(([category, skills]) => [category, skills.length])
  );
}

// =============================
// SKILL DATABASE (organized by category)
// =============================
const skillDatabase = {
  "Programming Languages": [
    "javascript", "typescript", "python", "java", "c++", "c#", "ruby",
    "go", "rust", "php", "swift", "kotlin", "scala", "r", "matlab",
    "perl", "haskell", "elixir", "dart", "objective-c"
  ],
  "Frontend": [
    "html", "css", "react", "angular", "vue", "vue.js", "next.js", "nextjs",
    "svelte", "tailwind", "tailwindcss", "bootstrap", "sass", "scss",
    "less", "material-ui", "mui", "chakra-ui", "redux", "zustand",
    "jquery", "dom", "responsive design", "web components", "pwa"
  ],
  "Backend": [
    "node", "node.js", "nodejs", "express", "express.js", "django", "flask",
    "spring", "spring boot", "ruby on rails", "rails", "laravel", "asp.net",
    "fastapi", "graphql", "rest", "rest api", "grpc", "websocket"
  ],
  "Databases": [
    "mongodb", "mysql", "postgresql", "postgres", "sql", "nosql", "redis",
    "elasticsearch", "firebase", "dynamodb", "cassandra", "mariadb",
    "sqlite", "oracle", "neo4j", "supabase"
  ],
  "Cloud & DevOps": [
    "aws", "amazon web services", "azure", "microsoft azure", "gcp",
    "google cloud", "docker", "kubernetes", "k8s", "jenkins", "ci/cd",
    "terraform", "ansible", "nginx", "apache", "github actions",
    "gitlab ci", "circleci", "heroku", "netlify", "vercel"
  ],
  "Tools & Frameworks": [
    "git", "github", "gitlab", "bitbucket", "jira", "confluence",
    "figma", "postman", "swagger", "webpack", "vite", "babel",
    "eslint", "prettier", "npm", "yarn", "pip", "maven", "gradle"
  ],
  "Data Science & AI": [
    "machine learning", "ml", "deep learning", "dl", "artificial intelligence",
    "ai", "nlp", "natural language processing", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "matplotlib", "seaborn", "jupyter", "data analysis", "data visualization",
    "data science", "neural networks", "transformers", "openai", "chatgpt"
  ],
  "Soft Skills": [
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "project management",
    "agile", "scrum", "collaboration", "mentoring", "presentation"
  ]
};

// Flatten all skills
const allSkills = Object.values(skillDatabase).flat();

// =============================
// SKILL ANALYSIS
// =============================
function analyzeSkills(text) {
  const lower = text.toLowerCase();
  const foundSkills = [];
  const skillCategories = {};

  Object.entries(skillDatabase).forEach(([category, skills]) => {
    const found = skills.filter(skill => lower.includes(skill));
    if (found.length > 0) {
      skillCategories[category] = found;
      found.forEach(skill => {
        if (!foundSkills.includes(skill)) {
          foundSkills.push(skill);
        }
      });
    }
  });

  const missingSkills = allSkills.filter(skill => !foundSkills.includes(skill));

  return { foundSkills, missingSkills, skillCategories };
}

// =============================
// JOB MATCHING
// =============================
function matchJobDescription(resumeText, jobText) {
  const lower = jobText.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const jobSkills = allSkills.filter(skill => lower.includes(skill));
  const matchedSkills = jobSkills.filter(skill => resumeLower.includes(skill));
  const missingSkills = jobSkills.filter(skill => !resumeLower.includes(skill));

  const matchScore = jobSkills.length === 0
    ? 0
    : Math.round((matchedSkills.length / jobSkills.length) * 100);

  // Keyword matching
  const jobWords = jobText.split(/\s+/).filter(w => w.length > 3);
  const matchedKeywords = jobWords.filter(w => resumeLower.includes(w.toLowerCase()));
  const keywordScore = jobWords.length === 0
    ? 0
    : Math.round((matchedKeywords.length / jobWords.length) * 100);

  return { jobSkills, matchedSkills, missingSkills, matchScore, keywordScore };
}

// =============================
// ATS SCORE
// =============================
function calculateATS(resumeText, jobText) {
  let score = 0;
  let maxScore = 0;

  // Skill matching (40 points)
  const jobSkillCount = allSkills.filter(s => jobText.toLowerCase().includes(s)).length;
  const matchedCount = allSkills.filter(s =>
    jobText.toLowerCase().includes(s) && resumeText.toLowerCase().includes(s)
  ).length;
  maxScore += 40;
  score += jobSkillCount > 0 ? (matchedCount / jobSkillCount) * 40 : 20;

  // Section presence (20 points)
  const sections = extractSections(resumeText);
  maxScore += 20;
  const sectionScore = Object.values(sections).filter(Boolean).length;
  score += (sectionScore / 4) * 20;

  // Length check (15 points)
  const wordCount = resumeText.split(/\s+/).length;
  maxScore += 15;
  if (wordCount >= 200 && wordCount <= 1000) score += 15;
  else if (wordCount >= 150 && wordCount <= 1500) score += 10;
  else if (wordCount >= 100) score += 5;

  // Contact info (10 points)
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
  const hasPhone = /[\d\s\-\+\(\)]{7,}/.test(resumeText);
  maxScore += 10;
  if (hasEmail) score += 5;
  if (hasPhone) score += 5;

  // Education section quality (10 points)
  maxScore += 10;
  if (sections.hasEducation) score += 5;
  if (/bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|degree/i.test(resumeText)) {
    score += 5;
  }

  // Experience section quality (5 points)
  maxScore += 5;
  if (sections.hasExperience) {
    score += 3;
    const years = resumeText.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i);
    if (years) score += 2;
  }

  return Math.min(Math.round((score / maxScore) * 100), 100);
}

// =============================
// SECTION DETECTION
// =============================
function extractSections(text) {
  const lower = text.toLowerCase();
  return {
    hasProjects: /projects?|portfolio|github/i.test(lower),
    hasExperience: /experience|employment|work history|internship|worked at/i.test(lower),
    hasEducation: /education|academic|university|college|degree|gpa|cgpa/i.test(lower),
    hasSkills: /skills?|technologies|technical|proficiencies|competencies/i.test(lower),
    hasCertifications: /certifications?|certified|certificate|licensed/i.test(lower),
    hasSummary: /summary|objective|profile|about me|introduction/i.test(lower),
    hasContact: /email|phone|linkedin|github\.com|contact/i.test(lower)
  };
}

// =============================
// RESUME METRICS
// =============================
function calculateMetrics(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Readability (simplified Flesch-Kincaid)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const readabilityScore = Math.round(
    206.835 - 1.015 * (wordCount / Math.max(sentenceCount, 1))
    - 84.6 * (syllableCount / Math.max(wordCount, 1))
  );

  // Action verbs detection
  const actionVerbs = [
    "achieved", "improved", "developed", "designed", "implemented",
    "led", "managed", "created", "built", "launched", "increased",
    "reduced", "optimized", "automated", "streamlined", "delivered",
    "collaborated", "mentored", "analyzed", "resolved", "established",
    "initiated", "transformed", "accelerated", "spearheaded", "orchestrated"
  ];

  const foundActionVerbs = actionVerbs.filter(verb =>
    text.toLowerCase().includes(verb)
  );

  // Quantifiable achievements
  const numbers = text.match(/\d+%|\d+\+|\$\d+|[\d,]+ (?:users|customers|projects|teams|people)/gi) || [];

  return {
    wordCount,
    sentenceCount,
    paragraphCount: paragraphs.length,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
    actionVerbsFound: foundActionVerbs,
    quantifiableAchievements: numbers.length,
    hasEmail: /[\w.-]+@[\w.-]+\.\w+/.test(text),
    hasPhone: /[\d\s\-\+\(\)]{7,}/.test(text),
    hasLinkedIn: /linkedin\.com/i.test(text),
    hasGitHub: /github\.com/i.test(text)
  };
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// =============================
// SUGGESTIONS
// =============================
function generateSuggestions(analysis, sections, jobMatch, atsScore, metrics) {
  const suggestions = [];

  // Section suggestions
  if (!sections.hasProjects) {
    suggestions.push({ type: "critical", text: "Add a Projects section with 2-3 real-world applications showcasing your skills." });
  }
  if (!sections.hasExperience) {
    suggestions.push({ type: "critical", text: "Include internship or practical work experience to demonstrate real-world application." });
  }
  if (!sections.hasSkills) {
    suggestions.push({ type: "critical", text: "Add a dedicated Skills section listing your technical and soft skills." });
  }
  if (!sections.hasEducation) {
    suggestions.push({ type: "warning", text: "Include your educational background (degree, university, GPA)." });
  }
  if (!sections.hasCertifications) {
    suggestions.push({ type: "info", text: "Consider adding relevant certifications to stand out." });
  }
  if (!sections.hasSummary) {
    suggestions.push({ type: "info", text: "Add a professional summary at the top to highlight your key qualifications." });
  }

  // Contact info
  if (!metrics.hasEmail) {
    suggestions.push({ type: "critical", text: "Add your professional email address." });
  }
  if (!metrics.hasPhone) {
    suggestions.push({ type: "critical", text: "Add your phone number for recruiters to contact you." });
  }
  if (!metrics.hasLinkedIn) {
    suggestions.push({ type: "info", text: "Include your LinkedIn profile URL." });
  }
  if (!metrics.hasGitHub) {
    suggestions.push({ type: "info", text: "Add your GitHub profile to showcase your code and projects." });
  }

  // Skills suggestions
  if (jobMatch.missingSkills.length > 0) {
    suggestions.push({
      type: "warning",
      text: `Add these job-relevant skills: ${jobMatch.missingSkills.slice(0, 8).join(", ")}`
    });
  }

  // ATS suggestions
  if (atsScore < 40) {
    suggestions.push({ type: "critical", text: "Your ATS score is very low. Focus on matching job keywords and adding relevant skills." });
  } else if (atsScore < 70) {
    suggestions.push({ type: "warning", text: "Improve ATS score by incorporating more keywords from the job description." });
  }

  // Metrics suggestions
  if (metrics.wordCount < 200) {
    suggestions.push({ type: "warning", text: `Your resume is only ${metrics.wordCount} words. Aim for 300-800 words for optimal length.` });
  } else if (metrics.wordCount > 1500) {
    suggestions.push({ type: "warning", text: `Your resume is ${metrics.wordCount} words. Consider condensing to 600-1000 words.` });
  }

  if (metrics.actionVerbsFound.length < 3) {
    suggestions.push({ type: "info", text: "Use more action verbs (achieved, developed, led, implemented) to describe your experiences." });
  }

  if (metrics.quantifiableAchievements === 0) {
    suggestions.push({ type: "info", text: "Add quantifiable achievements (e.g., 'increased efficiency by 30%', 'managed team of 5')." });
  }

  if (metrics.readabilityScore < 30) {
    suggestions.push({ type: "info", text: "Simplify your language for better readability. Aim for short, clear sentences." });
  }

  // Success messages
  if (suggestions.length === 0) {
    suggestions.push({ type: "success", text: "Excellent resume! You've covered all the key areas." });
  }

  return suggestions;
}

// =============================
// HISTORY MANAGEMENT
// =============================
function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, "utf8"));
    }
  } catch (e) {
    console.error("Error loading history:", e);
  }
  return [];
}

function saveHistory(history) {
  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error("Error saving history:", e);
  }
}

// =============================
// ROUTES
// =============================

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Resume Analyzer Backend Running" });
});

// Upload + Analyze
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumeText = await extractResumeText(req.file.path, req.file.mimetype);
    const jobDescription = req.body.jobDescription || "";

    // Run all analyses
    const analysis = analyzeSkills(resumeText);
    const jobMatch = matchJobDescription(resumeText, jobDescription);
    const atsScore = calculateATS(resumeText, jobDescription);
    const sections = extractSections(resumeText);
    const metrics = calculateMetrics(resumeText);
    const suggestions = generateSuggestions(analysis, sections, jobMatch, atsScore, metrics);
    const educationLevel = determineEducationLevel(resumeText);
    const readabilityCategory = getReadabilityCategory(metrics.readabilityScore);
    const categoryCounts = buildCategoryCounts(analysis.skillCategories);

    // Build response
    const result = {
      message: "Resume analyzed successfully",
      id: `analysis-${Date.now()}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      atsScore,
      educationLevel,
      readabilityCategory,
      categoryCounts,
      skills: {
        found: analysis.foundSkills,
        missing: analysis.missingSkills.slice(0, 15),
        categories: analysis.skillCategories,
        total: analysis.foundSkills.length
      },
      jobMatch,
      sections,
      metrics,
      suggestions,
      timestamp: new Date().toISOString()
    };

    // Save to history
    const history = loadHistory();
    history.unshift({
      id: Date.now(),
      fileName: req.file.originalname,
      atsScore,
      jobMatchScore: jobMatch.matchScore,
      skillsFound: analysis.foundSkills.length,
      timestamp: result.timestamp
    });
    // Keep only last 50 entries
    if (history.length > 50) history.length = 50;
    saveHistory(history);

    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.json(result);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error processing resume. Please ensure the file is a valid PDF, DOCX, or TXT file." });
  }
});

// Get analysis history
app.get("/history", (req, res) => {
  const history = loadHistory();
  res.json({ history });
});

// Clear history
app.delete("/history", (req, res) => {
  saveHistory([]);
  res.json({ message: "History cleared" });
});

// Get skill categories
app.get("/skills", (req, res) => {
  res.json({ categories: skillDatabase, totalSkills: allSkills.length });
});

// Static frontend assets (if built and available)
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
