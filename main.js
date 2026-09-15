// programme: Block Blast section principale
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 18.08.2026
// Version: V.2.0
// dernière modif: 10.09.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Ce fichier relie la logique du jeu à son affichage. C'est le seul endroit où la variable etat est remplacée, et le
seul endroit qui écrit dans la mémoire du navigateur.

Le programme tourne toujours de la même façon :

        le joueur fait quelque chose
                    |
                    v
        une fonction de game_logic.js renvoie un NOUVEL état
                    |
                    v
        etat = ce nouvel état
                    |
                    v
        afficherTout() redessine la page à partir de etat

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
game_logic.js contient les règles du jeu :

fonctions principales:
~~~~~~~~~~~~~~~~~~~~~~

creerEtatInitial(taille, nbCouleurs):
    - fabrique l'état de départ d'une partie, grille vide et premier lot de pièces

poserPiece(etat, idPiece, ligne, colonne):
    - pose la pièce, compte les points, supprime les lignes pleines, gère le combo
    - tire un nouveau lot quand les trois pièces ont été posées
    - renvoie l'état inchangé si la pose est impossible

lignesCasseesPar(grille, forme, ligne, colonne):
    - dit quelles lignes et colonnes sauteraient si on posait la forme ici, sans rien poser

partieTerminee(etat):
    - dit si aucune des pièces proposées ne rentre nulle part

basculerCase(etat, ligne, colonne):
    - remplit ou vide une case à la main, pour le mode debug

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
display.js contient tout ce qui touche à la page :

fonctions principales:
~~~~~~~~~~~~~~~~~~~~~~

afficherGrille(etat) / afficherReserve(etat) / afficherScore(etat, record) / afficherFinDePartie(etat):
    - redessinent chacun un morceau de la page à partir de l'état

initInteractionsGrille(surPose, surBascule):
    - branche le glisser-déposer et le clic du mode debug, une seule fois au démarrage

animerLignesCassees(etat, cassees):
    - fait clignoter les lignes qui viennent de sauter

appliquerTheme(theme) / afficherChoixTheme(surChoix):
    - gèrent les quatre thèmes de couleurs

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
variables de ce fichier:
~~~~~~~~~~~~~~~~~~~~~~~~~

etat:
    - l'état complet du jeu : grille, score, combo, pièces de la réserve
    - n'est jamais modifié sur place, toujours remplacé par un nouvel état

record:
    - meilleur score du joueur, conservé d'une partie à l'autre dans la mémoire du navigateur
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// côté de la grille de jeu
const TAILLE_GRILLE = 8;

// noms sous lesquels le navigateur retient le record et le thème choisi
const CLE_RECORD = "blockblast-record";
const CLE_THEME = "blockblast-theme";

// état de la partie en cours
let etat = creerEtatInitial(TAILLE_GRILLE, NB_COULEURS_PIECES);

// Number(null) vaut 0, et le "|| 0" couvre le cas où la valeur enregistrée ne serait pas un nombre
let record = Number(localStorage.getItem(CLE_RECORD)) || 0;

/**
 * redessine toute la page à partir de l'état courant
 * on redessine tout plutôt que de chercher ce qui a changé : à cette taille de grille c'est instantané, et c'est
 * beaucoup plus simple à suivre
 * :return: rien
 */
function afficherTout() {
    afficherGrille(etat);
    afficherScore(etat, record);
    afficherReserve(etat);
    afficherFinDePartie(etat);
}

/**
 * appelée quand le joueur lâche une pièce sur la grille
 * :param idPiece: identifiant de la pièce lâchée
 * :param ligne: ligne du coin haut-gauche
 * :param colonne: colonne du coin haut-gauche
 * :return: rien
 */
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

/**
 * appelée quand le joueur clique une case en mode debug
 * :param ligne: ligne de la case
 * :param colonne: colonne de la case
 * :return: rien
 */
function surBasculeCase(ligne, colonne) {
    etat = basculerCase(etat, ligne, colonne);
    afficherTout();
}

/**
 * appelée quand le joueur clique sur "Rejouer"
 * :return: rien
 */
function surRejouer() {
    etat = creerEtatInitial(TAILLE_GRILLE, NB_COULEURS_PIECES);
    afficherTout();
}

/**
 * appelée quand le joueur choisit un thème dans le panneau
 * :param theme: le thème choisi
 * :return: rien
 */
function surChoixTheme(theme) {
    appliquerTheme(theme);
    localStorage.setItem(CLE_THEME, theme.nom);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// démarrage du jeu
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
