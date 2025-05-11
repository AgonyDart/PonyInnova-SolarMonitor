document.addEventListener("DOMContentLoaded", function () {
  // Configuración
  const API_ENDPOINT = "http://192.168.66.35/data";
  const UPDATE_INTERVAL = 2000;
  const PESOS_PER_AMP = 1000 / 3; // 3A = $1000 MXN

  const currentChart = initChart(
    "currentChart",
    "Corriente (A)",
    ["Generador", "Referencia"],
    ["#3498db", "#e74c3c"]
  );

  const powerChart = initChart(
    "powerChart",
    "Potencia (W)",
    ["Generador", "Referencia"],
    ["#2ecc71", "#f39c12"]
  );

  const historicalData = {
    timestamps: [],
    currentGen: [],
    currentRef: [],
    powerGen: [],
    powerRef: [],
  };

  fetchData();
  setInterval(fetchData, UPDATE_INTERVAL);

  function initChart(canvasId, label, legends, colors) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: legends.map((legend, i) => ({
          label: legend,
          data: [],
          borderColor: colors[i],
          backgroundColor: `${colors[i]}20`,
          tension: 0.1,
          fill: true,
        })),
      },
      options: getChartOptions(label),
    });
  }

  function getChartOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: yLabel } },
        x: { title: { display: true, text: "Tiempo" } },
      },
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    };
  }

  function updateCharts(data) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    historicalData.timestamps.push(timeString);
    historicalData.currentGen.push(data.generator.current);
    historicalData.currentRef.push(data.reference.current);
    historicalData.powerGen.push(data.generator.power);
    historicalData.powerRef.push(data.reference.power);

    if (historicalData.timestamps.length > 20) {
      historicalData.timestamps.shift();
      historicalData.currentGen.shift();
      historicalData.currentRef.shift();
      historicalData.powerGen.shift();
      historicalData.powerRef.shift();
    }

    currentChart.data.labels = historicalData.timestamps;
    currentChart.data.datasets[0].data = historicalData.currentGen;
    currentChart.data.datasets[1].data = historicalData.currentRef;
    currentChart.update();

    powerChart.data.labels = historicalData.timestamps;
    powerChart.data.datasets[0].data = historicalData.powerGen;
    powerChart.data.datasets[1].data = historicalData.powerRef;
    powerChart.update();
  }

  function updatePanelInfo(data) {
    const container = document.getElementById("panelsContainer");
    container.innerHTML = `
      <div class="panel-card">
        <h3>Panel Generador</h3>
        <div class="panel-info">
          <div>
            <p>Voltaje:</p>
            <p class="panel-value">${data.generator.voltage.toFixed(2)} V</p>
          </div>
          <div>
            <p>Corriente:</p>
            <p class="panel-value">${data.generator.current.toFixed(2)} A</p>
          </div>
          <div>
            <p>Potencia:</p>
            <p class="panel-value">${data.generator.power.toFixed(2)} W</p>
          </div>
        </div>
      </div>
      <div class="panel-card">
        <h3>Panel Referencia</h3>
        <div class="panel-info">
          <div>
            <p>Voltaje:</p>
            <p class="panel-value">${data.reference.voltage.toFixed(2)} V</p>
          </div>
          <div>
            <p>Corriente:</p>
            <p class="panel-value">${data.reference.current.toFixed(2)} A</p>
          </div>
          <div>
            <p>Potencia:</p>
            <p class="panel-value">${data.reference.power.toFixed(2)} W</p>
          </div>
        </div>
      </div>
    `;
  }

  function updateMetrics(data) {
    document.getElementById(
      "efficiency"
    ).textContent = `${data.efficiency.toFixed(2)}%`;
    document.getElementById(
      "estimatedLoss"
    ).textContent = `$${data.estimated_loss_mxn.toFixed(2)} MXN`;
  }

  async function fetchData() {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      updateCharts(data);
      updatePanelInfo(data);
      updateMetrics(data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      document.getElementById("estimatedLoss").textContent =
        "Error obteniendo datos";
    }
  }
});
