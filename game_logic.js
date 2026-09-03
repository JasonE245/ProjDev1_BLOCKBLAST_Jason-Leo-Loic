// Formes en coordonnées [ligne, colonne], relatives au coin haut-gauche (0,0).
// Toutes les orientations du jeu original. Les cases n'ont pas besoin d'être
// adjacentes, ce qui permet les diagonales sans code particulier.
const SHAPES = {
    bloc: [[0, 0]],

    domino_h: [[0, 0], [0, 1]],
    domino_v: [[0, 0], [1, 0]],

    tromino_ligne_h: [[0, 0], [0, 1], [0, 2]],
    tromino_ligne_v: [[0, 0], [1, 0], [2, 0]],
    tromino_coin_0: [[0, 0], [0, 1], [1, 0]],
    tromino_coin_90: [[0, 0], [0, 1], [1, 1]],
    tromino_coin_180: [[0, 1], [1, 0], [1, 1]],
    tromino_coin_270: [[0, 0], [1, 0], [1, 1]],

    carre: [[0, 0], [0, 1], [1, 0], [1, 1]],
    carre3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],

    rect_2x3: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
    rect_3x2: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],

    ligne4_h: [[0, 0], [0, 1], [0, 2], [0, 3]],
    ligne4_v: [[0, 0], [1, 0], [2, 0], [3, 0]],
    ligne5_h: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    ligne5_v: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],

    l_0: [[0, 0], [1, 0], [2, 0], [2, 1]],
    l_90: [[0, 0], [0, 1], [0, 2], [1, 0]],
    l_180: [[0, 0], [0, 1], [1, 1], [2, 1]],
    l_270: [[1, 0], [1, 1], [1, 2], [0, 2]],

    j_0: [[0, 1], [1, 1], [2, 0], [2, 1]],
    j_90: [[0, 0], [1, 0], [1, 1], [1, 2]],
    j_180: [[0, 0], [0, 1], [1, 0], [2, 0]],
    j_270: [[0, 0], [0, 1], [0, 2], [1, 2]],

    t_bas: [[0, 0], [0, 1], [0, 2], [1, 1]],
    t_gauche: [[0, 1], [1, 0], [1, 1], [2, 1]],
    t_haut: [[0, 1], [1, 0], [1, 1], [1, 2]],
    t_droite: [[0, 0], [1, 0], [1, 1], [2, 0]],

    s_h: [[0, 1], [0, 2], [1, 0], [1, 1]],
    s_v: [[0, 0], [1, 0], [1, 1], [2, 1]],
    z_h: [[0, 0], [0, 1], [1, 1], [1, 2]],
    z_v: [[0, 1], [1, 0], [1, 1], [2, 0]],

    grand_l_0: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
    grand_l_90: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
    grand_l_180: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
    grand_l_270: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]],

    // diagonales "/" et "\"
    diagonale_2_0: [[0, 1], [1, 0]],
    diagonale_2_90: [[0, 0], [1, 1]],
    diagonale_3_0: [[0, 2], [1, 1], [2, 0]],
    diagonale_3_90: [[0, 0], [1, 1], [2, 2]],
};

// nb de couleurs de la palette active (voir themes[].pieces dans display.js)
const PIECE_COLOR_COUNT = 4;

// Barème de score (approximation non officielle du jeu original) :
//   score = 30 * L! * min(combo + 1, 6 * L)
// L = lignes/colonnes cassées d'un coup, combo = suppressions d'affilée précédentes.
// Non couvert : le bonus "board clear" (grille vidée), variable et pas encore compris.
const BASE_LINE_POINTS = 30;
const COMBO_CAP_PER_LINE = 6;

function factorial(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function lineClearScore(linesCleared, combo) {
    const multiplier = Math.min(combo + 1, COMBO_CAP_PER_LINE * linesCleared);
    return BASE_LINE_POINTS * factorial(linesCleared) * multiplier;
}

function createInitialState(size = 8) {
    const emptyState = {
        size,
        grid: Array.from({ length: size }, () => Array(size).fill(0)),
        score: 0,
        combo: 0,
        // vrai dès qu'une ligne saute dans le lot en cours ; décide en fin de lot si le combo tient
        clearedDuringBatch: false,
        pieces: [],
    };
    return { ...emptyState, pieces: generatePlayablePieces(emptyState, 3) };
}

// renvoie un nouvel état avec le score augmenté, ne modifie jamais l'état reçu
function addPoints(state, points) {
    return {
        ...state,
        score: state.score + points,
    };
}

// triplets identiques : fréquents sur le tout premier lot (grille vide), rares ensuite —
// comme dans le jeu original
const TRIPLE_CHANCE_EMPTY_GRID = 1 / 3;
const TRIPLE_CHANCE_IN_PLAY = 0.03;

function isGridEmpty(state) {
    return state.grid.every((gridRow) => gridRow.every((cell) => cell === 0));
}

function tripleChance(state) {
    if (!state) return TRIPLE_CHANCE_EMPTY_GRID;
    return isGridEmpty(state) ? TRIPLE_CHANCE_EMPTY_GRID : TRIPLE_CHANCE_IN_PLAY;
}

// poids plus fort pour les grosses formes, comme dans le jeu original : ~1 lot sur 2 en
// contient une, tant que la grille a la place (shapeNames ne contient que des formes posables)
const BIG_SHAPES = ["carre3", "rect_2x3", "rect_3x2"];
const BIG_SHAPE_WEIGHT = 5;

function pickWeightedShape(shapeNames) {
    const weightOf = (name) => (BIG_SHAPES.includes(name) ? BIG_SHAPE_WEIGHT : 1);
    const total = shapeNames.reduce((sum, name) => sum + weightOf(name), 0);

    let remaining = Math.random() * total;
    for (const name of shapeNames) {
        remaining -= weightOf(name);
        if (remaining < 0) return name;
    }
    return shapeNames[shapeNames.length - 1];
}

// tire `count` pièces posables sur l'état donné, pour toujours pouvoir continuer à jouer
function generatePieces(count, state = null) {
    const allShapes = Object.keys(SHAPES);
    const playable = state ? allShapes.filter((name) => canPlaceAnywhere(state, name)) : allShapes;
    const shapeNames = playable.length > 0 ? playable : allShapes;

    // tiré une fois pour tout le lot : si non nul, les 3 pièces partagent cette forme
    const tripleShape =
        Math.random() < tripleChance(state) ? pickWeightedShape(shapeNames) : null;

    return Array.from({ length: count }, () => ({
        id: `piece-${Math.random().toString(36).slice(2, 9)}`,
        shape: tripleShape || pickWeightedShape(shapeNames),
        color: Math.floor(Math.random() * PIECE_COLOR_COUNT),
    }));
}

// vrai s'il existe au moins une position de la grille où cette forme peut être posée
function canPlaceAnywhere(state, shapeName) {
    for (let row = 0; row < state.size; row++) {
        for (let col = 0; col < state.size; col++) {
            if (canPlacePiece(state, shapeName, row, col)) return true;
        }
    }
    return false;
}

// essais avant d'abandonner la garantie de lot posable (voir generatePlayablePieces)
const MAX_BATCH_ATTEMPTS = 40;

// grille obtenue après avoir posé une forme et supprimé les lignes pleines (test de faisabilité,
// la couleur n'a pas d'importance ici)
function simulatePlacement(state, shapeName, row, col) {
    const grid = state.grid.map((gridRow) => [...gridRow]);
    getShapeCells(shapeName, row, col).forEach(([r, c]) => {
        grid[r][c] = 1;
    });
    return clearFullLines({ ...state, grid }).grid;
}

// vrai s'il existe un ordre/emplacement pour poser TOUTES ces formes à la suite
// (recherche exhaustive avec retour en arrière, s'arrête à la première solution trouvée)
function canPlaceAllInSomeOrder(state, shapeNames) {
    if (shapeNames.length === 0) return true;

    return shapeNames.some((shapeName, index) => {
        const remaining = shapeNames.filter((_, i) => i !== index);

        for (let row = 0; row < state.size; row++) {
            for (let col = 0; col < state.size; col++) {
                if (!canPlacePiece(state, shapeName, row, col)) continue;
                const nextGrid = simulatePlacement(state, shapeName, row, col);
                if (canPlaceAllInSomeOrder({ ...state, grid: nextGrid }, remaining)) return true;
            }
        }
        return false;
    });
}

// tire un lot entièrement plaçable à la suite : les défaites viennent des choix de placement,
// pas du tirage. En dernier recours, un lot où chaque pièce est au moins plaçable seule.
function generatePlayablePieces(state, count) {
    for (let attempt = 0; attempt < MAX_BATCH_ATTEMPTS; attempt++) {
        const pieces = generatePieces(count, state);
        if (canPlaceAllInSomeOrder(state, pieces.map((piece) => piece.shape))) {
            return pieces;
        }
    }
    return generatePieces(count, state);
}

// fin de partie : aucune des pièces proposées ne peut être posée où que ce soit
function isGameOver(state) {
    return !state.pieces.some((piece) => canPlaceAnywhere(state, piece.shape));
}

// bascule une case vide/remplie ; utilisé par le mode debug pour tester les suppressions de ligne
function toggleCell(state, row, col) {
    const grid = state.grid.map((gridRow) => [...gridRow]);
    grid[row][col] = grid[row][col] === 0 ? 1 : 0;
    return { ...state, grid };
}

// cellules absolues occupées par une forme dont le coin haut-gauche est posé en (row, col)
function getShapeCells(shapeName, row, col) {
    return SHAPES[shapeName].map(([r, c]) => [row + r, col + c]);
}

function canPlacePiece(state, shapeName, row, col) {
    return getShapeCells(shapeName, row, col).every(
        ([r, c]) => r >= 0 && r < state.size && c >= 0 && c < state.size && state.grid[r][c] === 0
    );
}

// pose la pièce, ajoute les points, supprime les lignes pleines ; état inchangé si invalide.
// Un nouveau lot n'est tiré qu'une fois les 3 pièces posées.
function placePiece(state, pieceId, row, col) {
    const piece = state.pieces.find((p) => p.id === pieceId);
    if (!piece || !canPlacePiece(state, piece.shape, row, col)) {
        return state;
    }

    const grid = state.grid.map((gridRow) => [...gridRow]);
    getShapeCells(piece.shape, row, col).forEach(([r, c]) => {
        grid[r][c] = piece.color + 1;
    });

    const remainingPieces = state.pieces.filter((p) => p.id !== pieceId);

    const placedState = addPoints(
        { ...state, grid, pieces: remainingPieces },
        SHAPES[piece.shape].length
    );
    const clearedState = clearFullLines(placedState);

    if (clearedState.pieces.length > 0) {
        return clearedState;
    }

    // fin de lot : le combo ne retombe à 0 que si aucune des 3 pièces n'a supprimé de ligne
    const combo = clearedState.clearedDuringBatch ? clearedState.combo : 0;

    // tiré après les suppressions, sur la grille telle qu'elle sera affichée au joueur
    return {
        ...clearedState,
        combo,
        clearedDuringBatch: false,
        pieces: generatePlayablePieces(clearedState, 3),
    };
}

// index des lignes et colonnes entièrement remplies d'une grille
function findFullLines(state) {
    const { grid, size } = state;
    const rows = [];
    const cols = [];

    for (let r = 0; r < size; r++) {
        if (grid[r].every((cell) => cell !== 0)) rows.push(r);
    }
    for (let c = 0; c < size; c++) {
        if (grid.every((gridRow) => gridRow[c] !== 0)) cols.push(c);
    }
    return { rows, cols };
}

// lignes/colonnes que cette pose ferait sauter (utilisé pour l'aperçu au survol) ;
// listes vides si le placement est invalide
function getLinesClearedBy(state, shapeName, row, col) {
    if (!canPlacePiece(state, shapeName, row, col)) {
        return { rows: [], cols: [] };
    }

    const grid = state.grid.map((gridRow) => [...gridRow]);
    getShapeCells(shapeName, row, col).forEach(([r, c]) => {
        grid[r][c] = 1;
    });
    return findFullLines({ ...state, grid });
}

// vide les lignes pleines et ajoute les points (voir lineClearScore). Le combo monte ici,
// mais ne redescend jamais dans cette fonction — ça se décide en fin de lot, dans placePiece.
function clearFullLines(state) {
    const { grid } = state;
    const { rows: fullRows, cols: fullCols } = findFullLines(state);

    const linesCleared = fullRows.length + fullCols.length;
    if (linesCleared === 0) {
        return state;
    }

    const newGrid = grid.map((gridRow, r) =>
        gridRow.map((cell, c) => (fullRows.includes(r) || fullCols.includes(c) ? 0 : cell))
    );

    const points = lineClearScore(linesCleared, state.combo);

    return addPoints(
        { ...state, grid: newGrid, combo: state.combo + 1, clearedDuringBatch: true },
        points
    );
}