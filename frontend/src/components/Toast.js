import React, { useEffect, useState } from "react";

function Toast({ message, type, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 260);
    }, 3200);

    return () => clearTimeout(timer);
  }, [onClose]);

  const variants = {
    success: { accent: "var(--success)", background: "var(--success-soft)", badge: "OK" },
    error: { accent: "var(--danger)", background: "var(--danger-soft)", badge: "NO" },
    info: { accent: "var(--info)", background: "var(--info-soft)", badge: "FYI" },
    warning: { accent: "var(--warning)", background: "var(--warning-soft)", badge: "TIP" },
  };

  const current = variants[type] || variants.info;

  return (
    <button
      type="button"
      className={`toast-shell ${exiting ? "toast-exit" : ""}`}
      onClick={() => {
        setExiting(true);
        setTimeout(onClose, 260);
      }}
      style={{
        position: "fixed",
        top: 22,
        right: 22,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        gap: 14,
        minWidth: 280,
        maxWidth: 420,
        padding: "14px 16px",
        borderRadius: 20,
        border: `1px solid ${current.accent}33`,
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(16px)",
        transform: exiting ? "translateY(-10px) scale(0.98)" : "translateY(0) scale(1)",
        opacity: exiting ? 0 : 1,
        transition: "opacity 260ms ease, transform 260ms ease",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          color: current.accent,
          fontWeight: 800,
          fontSize: 12,
          background: current.background,
          flexShrink: 0,
        }}
      >
        {current.badge}
      </span>
      <span style={{ flex: 1, textAlign: "left", fontWeight: 700, lineHeight: 1.4 }}>{message}</span>
    </button>
  );
}

export default Toast;
