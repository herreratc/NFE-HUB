const yearSelect = document.getElementById("year");
const logsContainer = document.getElementById("logs");
const statusChip = document.getElementById("status-chip");
const uploadForm = document.getElementById("upload-form");
const startButton = document.getElementById("start-button");

function populateYears() {
  const currentYear = new Date().getFullYear();
  const span = 4; // 4 anos para frente facilita testes rápidos
  for (let i = 0; i <= span; i += 1) {
    const option = document.createElement("option");
    option.value = currentYear + i;
    option.textContent = currentYear + i;
    yearSelect.appendChild(option);
  }
}

function setStatus(label, tone = "info") {
  statusChip.textContent = label;
  statusChip.dataset.tone = tone;
  if (tone === "success") {
    statusChip.style.borderColor = "rgba(74, 222, 128, 0.45)";
    statusChip.style.color = "#bbf7d0";
  } else if (tone === "progress") {
    statusChip.style.borderColor = "rgba(34, 211, 238, 0.45)";
    statusChip.style.color = "#67e8f9";
  } else {
    statusChip.style.borderColor = "var(--border)";
    statusChip.style.color = "var(--text)";
  }
}

function createLog({ icon, title, subtitle }) {
  const item = document.createElement("div");
  item.className = "log-item";

  const iconWrap = document.createElement("div");
  iconWrap.className = "log-icon";
  iconWrap.textContent = icon;

  const textWrap = document.createElement("div");
  const text = document.createElement("p");
  text.className = "log-text";
  text.textContent = title;

  const subtext = document.createElement("p");
  subtext.className = "log-subtext";
  subtext.textContent = subtitle;

  textWrap.append(text, subtext);
  item.append(iconWrap, textWrap);
  logsContainer.appendChild(item);
  return item;
}

function addSpinnerTo(item) {
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.setAttribute("aria-label", "Processando");
  item.prepend(spinner);
  return spinner;
}

function clearLogs() {
  logsContainer.innerHTML = "";
}

function simulateProcessing() {
  const steps = [
    {
      icon: "🗂️",
      title: "Lendo pastas",
      subtitle: "Validando caminhos e permissões para ENV e CANC",
      duration: 900,
    },
    {
      icon: "📄",
      title: "Listando XMLs",
      subtitle: "Arquivos filtrados por mês e ano selecionados",
      duration: 1100,
    },
    {
      icon: "✅",
      title: "Validação",
      subtitle: "Checando duplicidade e estrutura das notas",
      duration: 1200,
    },
    {
      icon: "📦",
      title: "Organizando saída",
      subtitle: "Preparando zip de exportação e resumo",
      duration: 800,
    },
  ];

  clearLogs();
  setStatus("Processando...", "progress");
  startButton.disabled = true;

  let totalDelay = 0;
  steps.forEach((step, index) => {
    const logItem = createLog(step);
    const spinner = addSpinnerTo(logItem);
    totalDelay += step.duration;

    setTimeout(() => {
      logItem.classList.add("done");
      spinner.remove();
    }, totalDelay);

    if (index === steps.length - 1) {
      setTimeout(() => {
        setStatus("Processamento finalizado", "success");
        const summary = createLog({
          icon: "📊",
          title: "Resumo pronto",
          subtitle: "Total de 72 notas processadas em 4,1s",
        });
        summary.classList.add("done");
        startButton.disabled = false;
      }, totalDelay + 400);
    }
  });
}

populateYears();

uploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  simulateProcessing();
});
