// `pieces` fournit PIECE_COLOR_COUNT nuances de la même famille que `filled`,
// utilisées pour distinguer les pièces posées sur la grille
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

function renderScore(state, bestScore) {
    document.getElementById("score-display").textContent = `Score: ${state.score}`;
    document.getElementById("best-score").textContent = `Record: ${bestScore}`;

    // le combo n'est affiché qu'à partir de 2 suppressions consécutives, quand il rapporte
    const comboEl = document.getElementById("combo-display");
    comboEl.textContent = state.combo > 1 ? `Combo x${state.combo}` : "";
    comboEl.classList.toggle("visible", state.combo > 1);
}

// durée de l'animation de suppression, doit rester alignée sur @keyframes clear-flash (style.css)
const CLEAR_ANIMATION_MS = 450;

// fait clignoter les cases des lignes qui viennent d'être supprimées. Les lignes concernées sont
// calculées par la logique (getLinesClearedBy) AVANT la pose, puis transmises ici : l'affichage
// ne devine rien, il anime ce qu'on lui désigne.
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
        setTimeout(() => cellEl.classList.remove("just-cleared"), CLEAR_ANIMATION_MS);
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

// id de la pièce en cours de glisser-déposer ; état d'interaction transitoire propre à l'affichage,
// distinct de l'état du jeu (jamais lu ni modifié par game_logic.js)
let draggedPieceId = null;

// mode debug : taper "debug" n'importe où sur la page l'active/désactive (même principe que
// l'easter egg "awesome" de YouTube). Une fois actif, cliquer une case de la grille appelle
// onToggleCell(row, col) au lieu du glisser-déposer normal.
const DEBUG_TRIGGER = "debug";

function initDebugMode(onToggleCell) {
    let typedKeys = "";

    document.addEventListener("keydown", (event) => {
        if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return;
        typedKeys = (typedKeys + event.key.toLowerCase()).slice(-DEBUG_TRIGGER.length);
        if (typedKeys === DEBUG_TRIGGER) {
            document.body.classList.toggle("debug-mode");
        }
    });

    document.getElementById("grid").addEventListener("click", (event) => {
        if (!document.body.classList.contains("debug-mode")) return;
        const cell = event.target.closest(".cell");
        if (!cell) return;
        onToggleCell(Number(cell.dataset.row), Number(cell.dataset.col));
    });
}

// doit correspondre à la taille de .cell dans style.css
const CELL_SIZE = 40;

// convertit la position pixel du curseur (case survolée + décalage à l'intérieur de celle-ci)
// en la case d'origine (coin haut-gauche) de la forme, de façon à ce que la pièce apparaisse
// centrée sous le curseur, comme l'image de glisser-déposer ; recalculé à chaque survol pour
// suivre précisément le curseur plutôt que de figer un décalage fixe
function computeDropOrigin(shapeName, hoverRow, hoverCol, offsetX, offsetY) {
    const shape = SHAPES[shapeName];
    const rows = Math.max(...shape.map(([r]) => r)) + 1;
    const cols = Math.max(...shape.map(([, c]) => c)) + 1;
    const cursorRow = hoverRow + offsetY / CELL_SIZE;
    const cursorCol = hoverCol + offsetX / CELL_SIZE;
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
                    cell.classList.add("filled", `color-${piece.color}`);
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

function showPlacementPreview(state, shapeName, row, col, valid) {
    clearPlacementPreview();

    getShapeCells(shapeName, row, col).forEach(([r, c]) => {
        if (r < 0 || r >= state.size || c < 0 || c >= state.size) return;
        const cellEl = gridCellAt(r, c);
        if (cellEl) cellEl.classList.add(valid ? "preview-valid" : "preview-invalid");
    });

    if (!valid) return;

    // met en évidence les lignes et colonnes que cette pose ferait sauter, la logique
    // répondant à la question via getLinesClearedBy
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

function renderGrid(state, onDropPiece) {
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

            const cellValue = state.grid[row][col];
            if (cellValue !== 0) {
                cell.classList.add("filled", `color-${cellValue - 1}`);
            }

            cell.addEventListener("dragover", (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                const piece = state.pieces.find((p) => p.id === draggedPieceId);
                if (!piece) return;
                const origin = computeDropOrigin(piece.shape, row, col, event.offsetX, event.offsetY);
                showPlacementPreview(
                    state,
                    piece.shape,
                    origin.row,
                    origin.col,
                    canPlacePiece(state, piece.shape, origin.row, origin.col)
                );
            });

            cell.addEventListener("drop", (event) => {
                event.preventDefault();
                clearPlacementPreview();
                const pieceId = event.dataTransfer.getData("text/plain");
                const piece = state.pieces.find((p) => p.id === pieceId);
                if (!piece) return;
                const origin = computeDropOrigin(piece.shape, row, col, event.offsetX, event.offsetY);
                onDropPiece(pieceId, origin.row, origin.col);
            });

            container.appendChild(cell);
        }
    }
}
