const themes = [
    { name: "mauve", bg: "#1e1e2e", grid: "#313244", cell: "#45475a", filled: "#89b4fa" },
    { name: "rose", bg: "#2a1e2e", grid: "#3d2a3f", cell: "#5a4550", filled: "#f5a1c9" },
    { name: "forêt", bg: "#1a2418", grid: "#2b3a28", cell: "#40523c", filled: "#8fd97f" },
    { name: "ambre", bg: "#2a2016", grid: "#3f3122", cell: "#5c4a32", filled: "#f5b942" },
];

function applyTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty("--bg-color", theme.bg);
    root.setProperty("--grid-bg", theme.grid);
    root.setProperty("--cell-color", theme.cell);
    root.setProperty("--filled-color", theme.filled);
}

function renderThemePicker() {
    const panel = document.getElementById("theme-panel");
    panel.innerHTML = "";

    themes.forEach((theme) => {
        const swatch = document.createElement("div");
        swatch.className = "theme-swatch";
        swatch.style.background = theme.filled;
        swatch.title = theme.name;
        swatch.addEventListener("click", () => applyTheme(theme));
        panel.appendChild(swatch);
    });

    document.getElementById("theme-toggle").addEventListener("click", () => {
        panel.classList.toggle("open");
    });
}

function renderScore(state) {
    document.getElementById("score-display").textContent = `Score: ${state.score}`;
}

function renderGrid(state) {
    const container = document.getElementById("grid");
    container.style.gridTemplateColumns = `repeat(${state.size}, 40px)`;
    container.style.gridTemplateRows = `repeat(${state.size}, 40px)`;
    container.innerHTML = "";

    for (let row = 0; row < state.size; row++) {
        for (let col = 0; col < state.size; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (state.grid[row][col] !== 0) {
                cell.classList.add("filled");
            }

            container.appendChild(cell);
        }
    }
}