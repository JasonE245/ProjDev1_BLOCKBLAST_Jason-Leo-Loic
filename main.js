// Couche de contrôle : relie la logique pure (game_logic.js) à l'affichage (display.js).
// Cycle : action -> nouvel état -> réaffichage complet. Les effets de bord (localStorage)
// vivent ici, jamais dans les deux autres fichiers.
const CLE_RECORD = "blockblast-record";
const CLE_THEME = "blockblast-theme";

let etat = creerEtatInitial(8, NB_COULEURS_PIECES);
let record = litRecord();

function litRecord() {
    return Number(localStorage.getItem(CLE_RECORD)) || 0;
}

function enregistreRecordSiBattu(score) {
    if (score <= record) return;
    record = score;
    localStorage.setItem(CLE_RECORD, String(record));
}

function afficherTout() {
    afficherGrille(etat);
    afficherScore(etat, record);
    afficherReserve(etat);
    afficherFinDePartie(etat);
}

function surPosePiece(idPiece, ligne, colonne) {
    // calculé AVANT la pose, sinon les lignes ont déjà disparu et il n'y a plus rien à animer
    const piece = etat.pieces.find((p) => p.id === idPiece);
    const cleared = piece
        ? lignesCasseesPar(etat, piece.forme, ligne, colonne)
        : { lignes: [], colonnes: [] };

    etat = poserPiece(etat, idPiece, ligne, colonne);
    enregistreRecordSiBattu(etat.score);
    afficherTout();
    animerLignesCassees(etat, cleared);
}

function surBasculeCase(ligne, colonne) {
    etat = basculerCase(etat, ligne, colonne);
    afficherTout();
}

function surRejouer() {
    etat = creerEtatInitial(8, NB_COULEURS_PIECES);
    afficherTout();
}

function surChoixTheme(theme) {
    appliquerTheme(theme);
    localStorage.setItem(CLE_THEME, theme.nom);
}

// on retrouve le thème choisi la dernière fois, et à défaut le premier de la liste
const themeEnregistre = themes.find((t) => t.nom === localStorage.getItem(CLE_THEME));
appliquerTheme(themeEnregistre || themes[0]);

document.getElementById("bouton-rejouer").addEventListener("click", surRejouer);

afficherChoixTheme(surChoixTheme);
initInteractionsGrille(surPosePiece, surBasculeCase);
initRaccourciDebug();
afficherTout();
