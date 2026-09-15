// Couche de contrôle : relie la logique pure (game_logic.js) à l'affichage (display.js).
// Cycle : action -> nouvel état -> réaffichage complet. Les effets de bord (localStorage)
// vivent ici, jamais dans les deux autres fichiers.
const BEST_SCORE_KEY = "blockblast-record";
const THEME_KEY = "blockblast-theme";

let state = createInitialState(8, PIECE_COLOR_COUNT);
let bestScore = loadBestScore();

function loadBestScore() {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
}

function saveBestScoreIfBeaten(score) {
    if (score <= bestScore) return;
    bestScore = score;
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

function render() {
    renderGrid(state);
    renderScore(state, bestScore);
    renderPieceTray(state);
    renderGameOver(state, handleRestart);
}

function handleDropPiece(pieceId, row, col) {
    // calculé AVANT la pose, sinon les lignes ont déjà disparu et il n'y a plus rien à animer
    const piece = state.pieces.find((p) => p.id === pieceId);
    const cleared = piece
        ? getLinesClearedBy(state, piece.shape, row, col)
        : { rows: [], cols: [] };

    state = placePiece(state, pieceId, row, col);
    saveBestScoreIfBeaten(state.score);
    render();
    animateClearedLines(state, cleared);
}

function handleDebugToggle(row, col) {
    state = toggleCell(state, row, col);
    render();
}

function handleRestart() {
    state = createInitialState(8, PIECE_COLOR_COUNT);
    render();
}

function selectTheme(theme) {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme.name);
}

// on retrouve le thème choisi la dernière fois, et à défaut le premier de la liste
const savedTheme = themes.find((t) => t.name === localStorage.getItem(THEME_KEY));
applyTheme(savedTheme || themes[0]);

renderThemePicker(selectTheme);
initGridInteractions(handleDropPiece, handleDebugToggle);
initDebugShortcut();
render();
