document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

function initApp() {
  const panelsContainer = document.getElementById("panelsContainer");
  const totalLossElement = document.getElementById("totalLoss");

  if (!panelsContainer || !totalLossElement) {
    console.error(
      "Error: No se encontraron los elementos requeridos en el DOM"
    );
    return;
  }
  const API_ENDPOINT = "http://192.168.66.35/data";
  const UPDATE_INTERVAL = 2000;
  const PESOS_PER_AMP = 1000 / 3; // 3A = $1000 MXN

  const historicalData = {
    timestamps: [],
    panels: {},
  };

  const ctx = document.getElementById("ampsChart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amperaje (A)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Tiempo",
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });

  function calculateFinancialLoss(amps) {
    const maxExpected = 3;
    let totalLoss = 0;

    amps.forEach((panel) => {
      if (panel.amp < maxExpected) {
        const loss = (maxExpected - panel.amp) * PESOS_PER_AMP;
        totalLoss += loss;
      }
    });

    return totalLoss.toFixed(2);
  }

  function updatePanelCards(panelsData) {
    const container = document.getElementById("panelsContainer");
    container.innerHTML = "";

    let totalLoss = 0;

    panelsData.forEach((panel) => {
      const panelCard = document.createElement("div");
      panelCard.className = "panel-card";

      const maxExpected = 3;
      const loss =
        panel.amp < maxExpected ? (maxExpected - panel.amp) * PESOS_PER_AMP : 0;
      totalLoss += loss;

      panelCard.innerHTML = `
      <h3>Panel Solar #${panel.id}</h3>
      <div class="panel-info">
        <div>
          <p>Amperaje actual:</p>
          <p class="panel-value">${panel.amp.toFixed(2)} A</p>
        </div>
        <div>
          <p>Pérdida estimada:</p>
          <p class="panel-value panel-loss">$${loss.toFixed(2)} MXN</p>
        </div>
      </div>
    `;

      container.appendChild(panelCard);
    });

    document.getElementById("totalLoss").textContent = `$${totalLoss.toFixed(
      2
    )}`;
  }

  function updateChart(data) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    historicalData.timestamps.push(timeString);
    if (historicalData.timestamps.length > 15) {
      historicalData.timestamps.shift();
    }

    data.forEach((panel) => {
      if (!historicalData.panels[panel.id]) {
        historicalData.panels[panel.id] = [];

        chart.data.datasets.push({
          label: `Panel ${panel.id}`,
          data: [],
          borderColor: getRandomColor(),
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          tension: 0.1,
          fill: false,
        });
      }

      historicalData.panels[panel.id].push(panel.amp);
      if (historicalData.panels[panel.id].length > 15) {
        historicalData.panels[panel.id].shift();
      }
    });

    chart.data.labels = historicalData.timestamps;
    Object.keys(historicalData.panels).forEach((panelId, index) => {
      chart.data.datasets[index].data = historicalData.panels[panelId];
    });

    chart.update();
  }

  function getRandomColor() {
    const hex = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += hex[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  async function fetchData() {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error("Error en la respuesta");

      const data = await response.json();
      updatePanelCards(data.solar_panels);
      updateChart(data.solar_panels);

      const totalLoss = calculateFinancialLoss(data.solar_panels);
      document.getElementById("totalLoss").textContent = `$${totalLoss}`;
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  }

  fetchData(); // Primera carga
  setInterval(fetchData, UPDATE_INTERVAL);
}
