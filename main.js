// côté de la grille de jeu
const TAILLE_GRILLE = 8;

// noms sous lesquels le navigateur retient le record et le thème choisi
const CLE_RECORD = "blockblast-record";
const CLE_THEME = "blockblast-theme";

// état de la partie en cours
let etat = creerEtatInitial(TAILLE_GRILLE, NB_COULEURS_PIECES);

// Number(null) vaut 0, et le "|| 0" couvre le cas où la valeur enregistrée ne serait pas un nombre
let record = Number(localStorage.getItem(CLE_RECORD)) || 0;

function afficherTout() {
    afficherGrille(etat);
    afficherScore(etat, record);
    afficherReserve(etat);
    afficherFinDePartie(etat);
}

function surPosePiece(idPiece, ligne, colonne) {
    const piece = trouverPiece(etat.pieces, idPiece);
    if (piece === null) return;

    // calculé AVANT la pose : après, les lignes ont déjà sauté et il n'y aurait plus rien à faire clignoter
    const cassees = lignesCasseesPar(etat.grille, piece.forme, ligne, colonne);

    etat = poserPiece(etat, idPiece, ligne, colonne);

    // mise à jour du record, conservé pour les prochaines parties
    if (etat.score > record) {
        record = etat.score;
        localStorage.setItem(CLE_RECORD, String(record));
    }

    afficherTout();
    animerLignesCassees(etat, cassees);
}

function surBasculeCase(ligne, colonne) {
    etat = basculerCase(etat, ligne, colonne);
    afficherTout();
}

function surRejouer() {
    etat = creerEtatInitial(TAILLE_GRILLE, NB_COULEURS_PIECES);
    afficherTout();
}

function surChoixTheme(theme) {
    appliquerTheme(theme);
    localStorage.setItem(CLE_THEME, theme.nom);
}

// on retrouve le thème choisi la dernière fois, et à défaut on prend le premier de la liste
let themeEnregistre = null;
for (const theme of themes) {
    if (theme.nom === localStorage.getItem(CLE_THEME)) themeEnregistre = theme;
}
appliquerTheme(themeEnregistre !== null ? themeEnregistre : themes[0]);

afficherChoixTheme(surChoixTheme);
initInteractionsGrille(surPosePiece, surBasculeCase);
initRaccourciDebug();
document.getElementById("bouton-rejouer").addEventListener("click", surRejouer);

afficherTout();
