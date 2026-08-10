import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

function getInitialTheme() {
  const stored = localStorage.getItem("theme");
  return stored === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => getInitialTheme() === "dark");

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
