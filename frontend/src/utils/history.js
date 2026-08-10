export function normalizeHistory(items) {
  return items.map((item, index) => ({
    ...item,
    id: item.id || `history-${item.fileName || "resume"}-${item.timestamp || index}`,
    timestamp: item.timestamp || new Date(Date.now() - index * 60000).toISOString(),
  }));
}

export function loadHistory() {
  const raw = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
  const normalized = normalizeHistory(raw);

  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    localStorage.setItem("analysisHistory", JSON.stringify(normalized));
  }

  return normalized;
}
