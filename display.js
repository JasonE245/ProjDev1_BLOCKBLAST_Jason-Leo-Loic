// `pieces` = les nuances utilisées pour distinguer les pièces posées
const themes = [
    {
        name: "mauve", bg: "#1e1e2e", grid: "#313244", cell: "#45475a", filled: "#89b4fa",
        pieces: ["#89b4fa", "#74c7ec", "#94e2d5", "#b4befe"],
    },
    {
        name: "rose", bg: "#2a1e2e", grid: "#3d2a3f", cell: "#5a4550", filled: "#f5a1c9",
        pieces: ["#f5a1c9", "#f2a9e0", "#eba0e0", "#f5c2e7"],
    },
    {
        name: "forêt", bg: "#1a2418", grid: "#2b3a28", cell: "#40523c", filled: "#8fd97f",
        pieces: ["#8fd97f", "#a6e3a1", "#94e2a1", "#b8e994"],
    },
    {
        name: "ambre", bg: "#2a2016", grid: "#3f3122", cell: "#5c4a32", filled: "#f5b942",
        pieces: ["#f5b942", "#f9c74f", "#f8961e", "#f3a83c"],
    },
];

// la longueur de `pieces` est la seule source de vérité pour le nombre de couleurs du jeu
const PIECE_COLOR_COUNT = themes[0].pieces.length;

function applyTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty("--bg-color", theme.bg);
    root.setProperty("--grid-bg", theme.grid);
    root.setProperty("--cell-color", theme.cell);
    root.setProperty("--filled-color", theme.filled);
    theme.pieces.forEach((color, index) => {
        root.setProperty(`--piece-color-${index}`, color);
    });
}

function renderThemePicker(onSelect) {
    const panel = document.getElementById("theme-panel");
    panel.innerHTML = "";

    themes.forEach((theme) => {
        const swatch = document.createElement("button");
        swatch.className = "theme-swatch";
        swatch.style.background = theme.filled;
        swatch.title = theme.name;
        swatch.addEventListener("click", () => onSelect(theme));
        panel.appendChild(swatch);
    });

    document.getElementById("theme-toggle").addEventListener("click", () => {
        panel.classList.toggle("open");
    });
}

function renderScore(state, bestScore) {
    document.getElementById("score-display").textContent = `Score: ${state.score}`;
    document.getElementById("best-score").textContent = `Record: ${bestScore}`;

    // affiché seulement à partir de 2 suppressions d'affilée, quand il rapporte vraiment
    const comboEl = document.getElementById("combo-display");
    comboEl.textContent = state.combo > 1 ? `Combo x${state.combo}` : "";
    comboEl.classList.toggle("visible", state.combo > 1);
}

// fait clignoter les cases des lignes qui viennent d'être supprimées (lignes calculées
// AVANT la pose par getLinesClearedBy, puis transmises ici)
function animateClearedLines(state, { rows, cols }) {
    const cells = new Set();
    rows.forEach((r) => {
        for (let c = 0; c < state.size; c++) cells.add(gridCellAt(r, c));
    });
    cols.forEach((c) => {
        for (let r = 0; r < state.size; r++) cells.add(gridCellAt(r, c));
    });

    cells.forEach((cellEl) => {
        if (!cellEl) return;
        cellEl.classList.add("just-cleared");
        // la durée est celle du CSS : il n'y a donc pas de valeur à garder synchronisée
        cellEl.addEventListener("animationend", () => {
            cellEl.classList.remove("just-cleared");
        }, { once: true });
    });
}

function renderGameOver(state, onRestart) {
    const overlay = document.getElementById("game-over");
    const gameOver = isGameOver(state);
    overlay.classList.toggle("open", gameOver);

    if (!gameOver) return;
    document.getElementById("final-score").textContent = state.score;
    document.getElementById("restart-button").onclick = onRestart;
}

// id de la pièce en cours de glisser-déposer ; état d'affichage transitoire, pas de l'état du jeu
let draggedPieceId = null;

// mode debug : taper "debug" n'importe où sur la page l'active/désactive
const DEBUG_TRIGGER = "debug";

function initDebugShortcut() {
    let typedKeys = "";

    document.addEventListener("keydown", (event) => {
        if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return;
        typedKeys = (typedKeys + event.key.toLowerCase()).slice(-DEBUG_TRIGGER.length);
        if (typedKeys === DEBUG_TRIGGER) {
            document.body.classList.toggle("debug-mode");
        }
    });
}

// Dernier état affiché. Les écouteurs de la grille sont posés une seule fois alors que les
// cases sont recréées à chaque affichage : ils viennent lire l'état courant ici.
let displayedState = null;

// Les écouteurs sont posés sur la grille et non sur chacune des 64 cases : deux écouteurs
// au lieu de cent vingt-huit, et rien à rebrancher après un réaffichage.
function initGridInteractions(onDropPiece, onToggleCell) {
    const container = document.getElementById("grid");

    container.addEventListener("dragover", (event) => {
        const target = draggedPieceAt(event);
        if (!target) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const origin = computeDropOrigin(target.piece.shape, target.cell, event);
        showPlacementPreview(displayedState, target.piece.shape, origin.row, origin.col);
    });

    container.addEventListener("drop", (event) => {
        const target = draggedPieceAt(event);
        if (!target) return;
        event.preventDefault();
        clearPlacementPreview();
        const origin = computeDropOrigin(target.piece.shape, target.cell, event);
        onDropPiece(target.piece.id, origin.row, origin.col);
    });

    container.addEventListener("click", (event) => {
        if (!document.body.classList.contains("debug-mode")) return;
        const cell = event.target.closest(".cell");
        if (!cell) return;
        onToggleCell(Number(cell.dataset.row), Number(cell.dataset.col));
    });
}

// case survolée et pièce en cours de glisser, ou null si l'un des deux manque
function draggedPieceAt(event) {
    const cell = event.target.closest(".cell");
    if (!cell || !displayedState) return null;

    const piece = displayedState.pieces.find((p) => p.id === draggedPieceId);
    if (!piece) return null;

    return { cell, piece };
}

// taille d'une case en pixels, transmise au CSS par la variable --cell-size
const CELL_SIZE = 40;

// convertit la position du curseur en case d'origine (coin haut-gauche) de la forme,
// pour que la pièce paraisse centrée sous le curseur
function computeDropOrigin(shapeName, cell, event) {
    const shape = SHAPES[shapeName];
    const rows = Math.max(...shape.map(([r]) => r)) + 1;
    const cols = Math.max(...shape.map(([, c]) => c)) + 1;
    const cursorRow = Number(cell.dataset.row) + event.offsetY / CELL_SIZE;
    const cursorCol = Number(cell.dataset.col) + event.offsetX / CELL_SIZE;
    return {
        row: Math.round(cursorRow - rows / 2),
        col: Math.round(cursorCol - cols / 2),
    };
}

function renderPieceTray(state) {
    const container = document.getElementById("piece-tray");
    container.innerHTML = "";

    state.pieces.forEach((piece) => {
        const shape = SHAPES[piece.shape];
        const rows = Math.max(...shape.map(([row]) => row)) + 1;
        const cols = Math.max(...shape.map(([, col]) => col)) + 1;

        const slot = document.createElement("div");
        slot.className = "piece-slot";

        const pieceEl = document.createElement("div");
        pieceEl.className = "piece";
        pieceEl.draggable = true;
        pieceEl.style.gridTemplateColumns = `repeat(${cols}, 14px)`;
        pieceEl.style.gridTemplateRows = `repeat(${rows}, 14px)`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.className = "piece-cell";
                if (shape.some(([r, c]) => r === row && c === col)) {
                    cell.style.setProperty("--cell-fill", `var(--piece-color-${piece.color})`);
                }
                pieceEl.appendChild(cell);
            }
        }

        pieceEl.addEventListener("dragstart", (event) => {
            draggedPieceId = piece.id;
            event.dataTransfer.setData("text/plain", piece.id);
            event.dataTransfer.effectAllowed = "move";
            // centre l'image de glisser-déposer sous le curseur plutôt que sous son coin
            const rect = pieceEl.getBoundingClientRect();
            event.dataTransfer.setDragImage(pieceEl, rect.width / 2, rect.height / 2);
            pieceEl.classList.add("dragging");
        });

        pieceEl.addEventListener("dragend", () => {
            draggedPieceId = null;
            pieceEl.classList.remove("dragging");
            clearPlacementPreview();
        });

        slot.appendChild(pieceEl);
        container.appendChild(slot);
    });
}

function gridCellAt(row, col) {
    return document.querySelector(`#grid .cell[data-row="${row}"][data-col="${col}"]`);
}

function showPlacementPreview(state, shapeName, row, col) {
    clearPlacementPreview();

    const valid = canPlacePiece(state, shapeName, row, col);

    getShapeCells(shapeName, row, col).forEach(([r, c]) => {
        if (r < 0 || r >= state.size || c < 0 || c >= state.size) return;
        const cellEl = gridCellAt(r, c);
        if (cellEl) cellEl.classList.add(valid ? "preview-valid" : "preview-invalid");
    });

    if (!valid) return;

    // met en évidence les lignes/colonnes que cette pose ferait sauter (getLinesClearedBy)
    const { rows, cols } = getLinesClearedBy(state, shapeName, row, col);

    rows.forEach((r) => {
        for (let c = 0; c < state.size; c++) gridCellAt(r, c)?.classList.add("preview-clear");
    });
    cols.forEach((c) => {
        for (let r = 0; r < state.size; r++) gridCellAt(r, c)?.classList.add("preview-clear");
    });
}

function clearPlacementPreview() {
    document
        .querySelectorAll("#grid .cell.preview-valid, #grid .cell.preview-invalid, #grid .cell.preview-clear")
        .forEach((cellEl) =>
            cellEl.classList.remove("preview-valid", "preview-invalid", "preview-clear")
        );
}

function renderGrid(state) {
    // les écouteurs posés sur la grille viendront lire cet état
    displayedState = state;

    const container = document.getElementById("grid");
    container.style.setProperty("--cell-size", `${CELL_SIZE}px`);
    container.style.gridTemplateColumns = `repeat(${state.size}, var(--cell-size))`;
    container.style.gridTemplateRows = `repeat(${state.size}, var(--cell-size))`;
    container.innerHTML = "";

    for (let row = 0; row < state.size; row++) {
        for (let col = 0; col < state.size; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            const cellValue = state.grid[row][col];
            if (cellValue !== 0) {
                cell.style.setProperty("--cell-fill", `var(--piece-color-${cellValue - 1})`);
            }

            container.appendChild(cell);
        }
    }
}
