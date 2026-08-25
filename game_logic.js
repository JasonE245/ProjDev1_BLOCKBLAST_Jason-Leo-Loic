// formes définies en coordonnées [ligne, colonne] relatives, coin haut-gauche à (0,0).
// Reflète les formes confirmées présentes dans le jeu original (captures d'écran) : les 7
// tétrominos, trominos, dominos, bloc simple, lignes de 4/5, carrés, grand L, et diagonales
// de 2/3 cases. Chaque forme est déclinée dans toutes ses orientations distinctes (les formes
// symétriques sous rotation, comme les carrés, n'ont qu'une seule variante). Les cases d'une
// forme n'ont pas besoin d'être adjacentes par un côté : getShapeCells/canPlacePiece ne font
// aucune hypothèse d'adjacence, ce qui permet aux diagonales de fonctionner sans code spécifique.
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

    // deux orientations possibles pour une diagonale : "/" et "\"
    diagonale_2_0: [[0, 1], [1, 0]],
    diagonale_2_90: [[0, 0], [1, 1]],
    diagonale_3_0: [[0, 2], [1, 1], [2, 0]],
    diagonale_3_90: [[0, 0], [1, 1], [2, 2]],
};

// nombre de couleurs disponibles dans la palette du thème actif (voir themes[].pieces dans display.js)
const PIECE_COLOR_COUNT = 4;

// points de base par ligne/colonne supprimée, bonus par ligne supplémentaire supprimée
// simultanément, et bonus par palier de combo (parties consécutives avec suppression)
const LINE_CLEAR_POINTS = 10;
const MULTI_LINE_BONUS = 10;
const COMBO_BONUS = 5;

function createInitialState(size = 8) {
    const emptyState = {
        size,
        grid: Array.from({ length: size }, () => Array(size).fill(0)),
        score: 0,
        combo: 0,
        pieces: [],
        selectedPieceId: null,
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

// tire `count` pièces aléatoires. Si un état est fourni, le tirage est restreint aux formes
// réellement posables sur sa grille : c'est la contrainte de conception du projet, les pièces
// distribuées doivent toujours permettre de continuer à jouer. Si plus aucune forme n'est
// posable, on tire sans restriction et isGameOver détectera la fin de partie.
function generatePieces(count, state = null) {
    const allShapes = Object.keys(SHAPES);
    const playable = state ? allShapes.filter((name) => canPlaceAnywhere(state, name)) : allShapes;
    const shapeNames = playable.length > 0 ? playable : allShapes;

    return Array.from({ length: count }, () => ({
        id: `piece-${Math.random().toString(36).slice(2, 9)}`,
        shape: shapeNames[Math.floor(Math.random() * shapeNames.length)],
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

// nombre de lots tirés au hasard avant d'abandonner la garantie complète (voir generatePlayablePieces)
const MAX_BATCH_ATTEMPTS = 40;

// renvoie la grille obtenue après avoir posé une forme et supprimé les lignes pleines.
// Utilisé uniquement par la recherche de faisabilité : seule l'occupation des cases compte,
// d'où le remplissage avec 1 sans se soucier de la couleur.
function simulatePlacement(state, shapeName, row, col) {
    const grid = state.grid.map((gridRow) => [...gridRow]);
    getShapeCells(shapeName, row, col).forEach(([r, c]) => {
        grid[r][c] = 1;
    });
    return clearFullLines({ ...state, grid }).grid;
}

// vrai s'il existe un ordre et des positions permettant de poser TOUTES ces formes à la suite,
// en tenant compte des lignes supprimées en cours de route qui libèrent de la place.
// Recherche exhaustive avec retour en arrière : elle s'arrête dès qu'une solution est trouvée.
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

// tire un lot dont les `count` pièces sont toutes plaçables à la suite : le joueur peut donc
// toujours écouler le lot entier s'il joue bien. C'est ce qui fait reposer les défaites sur les
// choix de placement (skill) plutôt que sur le tirage (chance).
// En dernier recours après MAX_BATCH_ATTEMPTS essais, on retombe sur un lot dont chaque pièce est
// au moins plaçable individuellement.
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

// renvoie un nouvel état avec la pièce désignée comme sélectionnée
function selectPiece(state, pieceId) {
    return {
        ...state,
        selectedPieceId: pieceId,
    };
}

// bascule une case entre vide et remplie (bloc 1x1) ; réservé au mode debug pour tester
// rapidement la suppression de lignes sans avoir à poser des pièces
function toggleCell(state, row, col) {
    const grid = state.grid.map((gridRow) => [...gridRow]);
    grid[row][col] = grid[row][col] === 0 ? 1 : 0;
    return { ...state, grid };
}

// cellules absolues occupées par une forme dont le coin haut-gauche (case [0,0]) est posé en (row, col).
// Le calcul de la case à passer ici pour que la pièce paraisse centrée sous le curseur est
// un problème d'affichage (position du curseur en pixels) et se fait dans display.js.
function getShapeCells(shapeName, row, col) {
    return SHAPES[shapeName].map(([r, c]) => [row + r, col + c]);
}

function canPlacePiece(state, shapeName, row, col) {
    return getShapeCells(shapeName, row, col).every(
        ([r, c]) => r >= 0 && r < state.size && c >= 0 && c < state.size && state.grid[r][c] === 0
    );
}

// pose la pièce si le placement est valide, ajoute des points, et déclenche la suppression
// des lignes/colonnes pleines ; renvoie l'état inchangé si le placement est invalide.
// Un nouveau lot de 3 pièces n'est tiré que lorsque les 3 pièces proposées ont toutes été posées.
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
        { ...state, grid, pieces: remainingPieces, selectedPieceId: null },
        SHAPES[piece.shape].length
    );
    const clearedState = clearFullLines(placedState);

    if (clearedState.pieces.length > 0) {
        return clearedState;
    }
    // le nouveau lot est tiré après la suppression des lignes, pour que les pièces soient
    // choisies en fonction de la grille telle qu'elle sera réellement affichée au joueur
    return { ...clearedState, pieces: generatePlayablePieces(clearedState, 3) };
}

// vide les lignes et colonnes entièrement remplies. Le score ajouté combine 3 bonus :
// - LINE_CLEAR_POINTS par ligne/colonne supprimée
// - MULTI_LINE_BONUS par ligne supplémentaire supprimée en même temps (plusieurs lignes d'un coup)
// - COMBO_BONUS par palier de combo, qui augmente tant que les poses successives suppriment
//   au moins une ligne, et retombe à 0 dès qu'une pose n'en supprime aucune
function clearFullLines(state) {
    const { grid, size } = state;
    const fullRows = [];
    const fullCols = [];

    for (let r = 0; r < size; r++) {
        if (grid[r].every((cell) => cell !== 0)) fullRows.push(r);
    }
    for (let c = 0; c < size; c++) {
        if (grid.every((gridRow) => gridRow[c] !== 0)) fullCols.push(c);
    }

    const linesCleared = fullRows.length + fullCols.length;
    if (linesCleared === 0) {
        return { ...state, combo: 0 };
    }

    const newGrid = grid.map((gridRow, r) =>
        gridRow.map((cell, c) => (fullRows.includes(r) || fullCols.includes(c) ? 0 : cell))
    );

    const points =
        linesCleared * LINE_CLEAR_POINTS +
        (linesCleared - 1) * MULTI_LINE_BONUS +
        state.combo * COMBO_BONUS;

    return addPoints({ ...state, grid: newGrid, combo: state.combo + 1 }, points);
}