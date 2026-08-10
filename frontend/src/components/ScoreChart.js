import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function ScoreChart({ score, size = 140, label = "Score", color }) {
  const tone = color || (score >= 80 ? "#16a34a" : score >= 60 ? "#0ea5e9" : score >= 40 ? "#d97706" : "#dc2626");

  const data = {
    labels: [label, "Remaining"],
    datasets: [
      {
        data: [score, Math.max(0, 100 - score)],
        backgroundColor: [tone, "rgba(148, 163, 184, 0.15)"],
        borderWidth: 0,
        spacing: 2,
        hoverOffset: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: {
      animateRotate: true,
      duration: 900,
    },
  };

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "\"Sora\", sans-serif",
              fontSize: size > 100 ? 28 : 22,
              fontWeight: 800,
              lineHeight: 1,
              color: tone,
            }}
          >
            {score}%
          </div>
          {label ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ScoreChart;
