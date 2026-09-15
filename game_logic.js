// Formes en coordonnées [ligne, colonne], relatives au coin haut-gauche (0, 0).
// Toute forme touche la ligne 0 et la colonne 0, ce qui permet de calculer sa taille
// avec un simple maximum. Les cases n'ont pas besoin d'être adjacentes, ce qui donne
// les diagonales sans code particulier.
// Les tailles sont notées lignes x colonnes, comme les coordonnées.
const FORMES = {
    bloc: [[0, 0]],

    ligne2_h: [[0, 0], [0, 1]],
    ligne2_v: [[0, 0], [1, 0]],
    ligne3_h: [[0, 0], [0, 1], [0, 2]],
    ligne3_v: [[0, 0], [1, 0], [2, 0]],
    ligne4_h: [[0, 0], [0, 1], [0, 2], [0, 3]],
    ligne4_v: [[0, 0], [1, 0], [2, 0], [3, 0]],
    ligne5_h: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    ligne5_v: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],

    coin_0: [[0, 0], [0, 1], [1, 0]],
    coin_90: [[0, 0], [0, 1], [1, 1]],
    coin_180: [[0, 1], [1, 0], [1, 1]],
    coin_270: [[0, 0], [1, 0], [1, 1]],

    carre_2x2: [[0, 0], [0, 1], [1, 0], [1, 1]],
    carre_3x3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    rect_2x3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    rect_3x2: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],

    l_0: [[0, 0], [1, 0], [2, 0], [2, 1]],
    l_90: [[0, 0], [0, 1], [0, 2], [1, 0]],
    l_180: [[0, 0], [0, 1], [1, 1], [2, 1]],
    l_270: [[0, 2], [1, 0], [1, 1], [1, 2]],

    j_0: [[0, 1], [1, 1], [2, 0], [2, 1]],
    j_90: [[0, 0], [1, 0], [1, 1], [1, 2]],
    j_180: [[0, 0], [0, 1], [1, 0], [2, 0]],
    j_270: [[0, 0], [0, 1], [0, 2], [1, 2]],

    t_0: [[0, 0], [0, 1], [0, 2], [1, 1]],
    t_90: [[0, 1], [1, 0], [1, 1], [2, 1]],
    t_180: [[0, 1], [1, 0], [1, 1], [1, 2]],
    t_270: [[0, 0], [1, 0], [1, 1], [2, 0]],

    s_h: [[0, 1], [0, 2], [1, 0], [1, 1]],
    s_v: [[0, 0], [1, 0], [1, 1], [2, 1]],
    z_h: [[0, 0], [0, 1], [1, 1], [1, 2]],
    z_v: [[0, 1], [1, 0], [1, 1], [2, 0]],

    grand_l_0: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
    grand_l_90: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
    grand_l_180: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
    grand_l_270: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]],

    diagonale2_montante: [[0, 1], [1, 0]],
    diagonale2_descendante: [[0, 0], [1, 1]],
    diagonale3_montante: [[0, 2], [1, 1], [2, 0]],
    diagonale3_descendante: [[0, 0], [1, 1], [2, 2]],
};

// Barème de score (approximation non officielle du jeu original) :
//   score = 30 * L! * min(combo + 1, 6 * L)
// L = lignes/colonnes cassées d'un coup, combo = suppressions d'affilée précédentes.
// Non couvert : le bonus "board clear" (grille vidée), variable et pas encore compris.
const POINTS_PAR_LIGNE = 30;
const PLAFOND_COMBO_PAR_LIGNE = 6;

// Une pièce casse au plus 6 lignes d'un coup : 5 lignes + 1 colonne avec une ligne5,
// 3 + 3 avec un carré 3x3. La borne évite que la factorielle s'emballe si une forme
// plus grosse était ajoutée un jour.
const MAX_LIGNES_COMPTEES = 6;

function factorielle(n) {
    let resultat = 1;
    for (let i = 2; i <= n; i++) resultat *= i;
    return resultat;
}

function pointsDeSuppression(nbLignes, combo) {
    const lines = Math.min(nbLignes, MAX_LIGNES_COMPTEES);
    const multiplicateur = Math.min(combo + 1, PLAFOND_COMBO_PAR_LIGNE * lines);
    return POINTS_PAR_LIGNE * factorielle(lines) * multiplicateur;
}

function creerEtatInitial(taille = 8, nbCouleurs = 4) {
    const etatVide = {
        taille,
        nbCouleurs,
        grille: Array.from({ length: taille }, () => Array(taille).fill(0)),
        score: 0,
        combo: 0,
        // vrai dès qu'une ligne saute dans le lot en cours ; décide en fin de lot si le combo tient
        ligneCasseeDansLeLot: false,
        pieces: [],
    };
    return { ...etatVide, pieces: tirerLotPosable(etatVide, 3) };
}

// renvoie un nouvel état avec le score augmenté, ne modifie jamais l'état reçu
function ajouterPoints(etat, points) {
    return {
        ...etat,
        score: etat.score + points,
    };
}

// triplets identiques : fréquents sur le tout premier lot (grille vide), rares ensuite —
// comme dans le jeu original
const CHANCE_TRIPLE_GRILLE_VIDE = 1 / 3;
const CHANCE_TRIPLE_EN_JEU = 0.03;

function grilleEstVide(etat) {
    return etat.grille.every((ligneGrille) => ligneGrille.every((caseCourante) => caseCourante === 0));
}

function chanceTriple(etat) {
    if (!etat) return CHANCE_TRIPLE_GRILLE_VIDE;
    return grilleEstVide(etat) ? CHANCE_TRIPLE_GRILLE_VIDE : CHANCE_TRIPLE_EN_JEU;
}

// poids plus fort pour les grosses formes, comme dans le jeu original : ~1 lot sur 2 en
// contient une, tant que la grille a la place (shapeNames ne contient que des formes posables)
const GROSSES_FORMES = ["carre_3x3", "rect_2x3", "rect_3x2"];
const POIDS_GROSSE_FORME = 5;

function tirerFormePonderee(formes) {
    const poidsDe = (nom) => (GROSSES_FORMES.includes(nom) ? POIDS_GROSSE_FORME : 1);
    const total = formes.reduce((sum, nom) => sum + poidsDe(nom), 0);

    let restant = Math.random() * total;
    for (const nom of formes) {
        restant -= poidsDe(nom);
        if (restant < 0) return nom;
    }
    return formes[formes.length - 1];
}

// tire `count` pièces posables sur l'état donné, pour toujours pouvoir continuer à jouer
function creerPieces(nombre, etat = null) {
    const toutesLesFormes = Object.keys(FORMES);
    const posables = etat ? toutesLesFormes.filter((nom) => peutPoserQuelquePart(etat, nom)) : toutesLesFormes;
    const formes = posables.length > 0 ? posables : toutesLesFormes;

    // tiré une fois pour tout le lot : si non nul, les 3 pièces partagent cette forme
    const formeCommune =
        Math.random() < chanceTriple(etat) ? tirerFormePonderee(formes) : null;

    return Array.from({ length: nombre }, () => ({
        id: `piece-${Math.random().toString(36).slice(2, 9)}`,
        forme: formeCommune || tirerFormePonderee(formes),
        couleur: Math.floor(Math.random() * etat.nbCouleurs),
    }));
}

// vrai s'il existe au moins une position de la grille où cette forme peut être posée
function peutPoserQuelquePart(etat, forme) {
    for (let ligne = 0; ligne < etat.taille; ligne++) {
        for (let colonne = 0; colonne < etat.taille; colonne++) {
            if (peutPoser(etat, forme, ligne, colonne)) return true;
        }
    }
    return false;
}

// essais avant d'abandonner la garantie de lot posable (voir generatePlayablePieces)
const MAX_ESSAIS_LOT = 40;

// grille obtenue après avoir posé une forme et supprimé les lignes pleines (test de faisabilité,
// la couleur n'a pas d'importance ici)
function grilleApresPose(etat, forme, ligne, colonne) {
    const grille = grilleAvecForme(etat.grille, forme, ligne, colonne, 1);
    return supprimerLignesPleines({ ...etat, grille }).grille;
}

// vrai s'il existe un ordre/emplacement pour poser TOUTES ces formes à la suite
// (recherche exhaustive avec retour en arrière, s'arrête à la première solution trouvée)
function peutToutPoserDansUnOrdre(etat, formes) {
    if (formes.length === 0) return true;

    return formes.some((forme, index) => {
        const restant = formes.filter((_, i) => i !== index);

        for (let ligne = 0; ligne < etat.taille; ligne++) {
            for (let colonne = 0; colonne < etat.taille; colonne++) {
                if (!peutPoser(etat, forme, ligne, colonne)) continue;
                const grilleSuivante = grilleApresPose(etat, forme, ligne, colonne);
                if (peutToutPoserDansUnOrdre({ ...etat, grille: grilleSuivante }, restant)) return true;
            }
        }
        return false;
    });
}

// tire un lot entièrement plaçable à la suite : les défaites viennent des choix de placement,
// pas du tirage. En dernier recours, un lot où chaque pièce est au moins plaçable seule.
function tirerLotPosable(etat, nombre) {
    for (let essai = 0; essai < MAX_ESSAIS_LOT; essai++) {
        const pieces = creerPieces(nombre, etat);
        if (peutToutPoserDansUnOrdre(etat, pieces.map((piece) => piece.forme))) {
            return pieces;
        }
    }
    return creerPieces(nombre, etat);
}

// fin de partie : aucune des pièces proposées ne peut être posée où que ce soit
function partieTerminee(etat) {
    return !etat.pieces.some((piece) => peutPoserQuelquePart(etat, piece.forme));
}

// bascule une case vide/remplie ; sert au mode debug pour préparer une situation à la main
function basculerCase(etat, ligne, colonne) {
    const grille = copierGrille(etat.grille);
    grille[ligne][colonne] = grille[ligne][colonne] === 0 ? 1 : 0;
    return { ...etat, grille };
}

// cellules absolues occupées par une forme dont le coin haut-gauche est posé en (row, col)
function casesDeLaForme(forme, ligne, colonne) {
    return FORMES[forme].map(([r, c]) => [ligne + r, colonne + c]);
}

// copie indépendante : écrire dans la copie ne touche pas l'originale
function copierGrille(grille) {
    return grille.map((ligneGrille) => [...ligneGrille]);
}

// copie de la grille avec la forme dessinée dessus, chaque case à `value`
function grilleAvecForme(grille, forme, ligne, colonne, value) {
    const next = copierGrille(grille);
    casesDeLaForme(forme, ligne, colonne).forEach(([r, c]) => {
        next[r][c] = value;
    });
    return next;
}

// copie de la grille avec les lignes et colonnes indiquées vidées
function grilleSansLignes(grille, { lignes, colonnes }) {
    const taille = grille.length;
    const next = copierGrille(grille);

    for (const ligne of lignes) {
        for (let colonne = 0; colonne < taille; colonne++) next[ligne][colonne] = 0;
    }
    for (const colonne of colonnes) {
        for (let ligne = 0; ligne < taille; ligne++) next[ligne][colonne] = 0;
    }
    return next;
}

function peutPoser(etat, forme, ligne, colonne) {
    return casesDeLaForme(forme, ligne, colonne).every(
        ([r, c]) => r >= 0 && r < etat.taille && c >= 0 && c < etat.taille && etat.grille[r][c] === 0
    );
}

// pose la pièce, ajoute les points, supprime les lignes pleines ; état inchangé si invalide.
// Un nouveau lot n'est tiré qu'une fois les 3 pièces posées.
function poserPiece(etat, idPiece, ligne, colonne) {
    const piece = etat.pieces.find((p) => p.id === idPiece);
    if (!piece || !peutPoser(etat, piece.forme, ligne, colonne)) {
        return etat;
    }

    const grille = grilleAvecForme(etat.grille, piece.forme, ligne, colonne, piece.couleur + 1);

    const reserve = etat.pieces.filter((p) => p.id !== idPiece);

    const etatPose = ajouterPoints(
        { ...etat, grille, pieces: reserve },
        FORMES[piece.forme].length
    );
    const etatNettoye = supprimerLignesPleines(etatPose);

    if (etatNettoye.pieces.length > 0) {
        return etatNettoye;
    }

    // fin de lot : le combo ne retombe à 0 que si aucune des 3 pièces n'a supprimé de ligne
    const combo = etatNettoye.ligneCasseeDansLeLot ? etatNettoye.combo : 0;

    // tiré après les suppressions, sur la grille telle qu'elle sera affichée au joueur
    return {
        ...etatNettoye,
        combo,
        ligneCasseeDansLeLot: false,
        pieces: tirerLotPosable(etatNettoye, 3),
    };
}

// index des lignes et colonnes entièrement remplies d'une grille
function chercherLignesPleines(etat) {
    const { grille, taille } = etat;
    const lignes = [];
    const colonnes = [];

    for (let r = 0; r < taille; r++) {
        if (grille[r].every((caseCourante) => caseCourante !== 0)) lignes.push(r);
    }
    for (let c = 0; c < taille; c++) {
        if (grille.every((ligneGrille) => ligneGrille[c] !== 0)) colonnes.push(c);
    }
    return { lignes, colonnes };
}

// lignes/colonnes que cette pose ferait sauter (utilisé pour l'aperçu au survol) ;
// listes vides si le placement est invalide
function lignesCasseesPar(etat, forme, ligne, colonne) {
    if (!peutPoser(etat, forme, ligne, colonne)) {
        return { lignes: [], colonnes: [] };
    }

    const grille = grilleAvecForme(etat.grille, forme, ligne, colonne, 1);
    return chercherLignesPleines({ ...etat, grille });
}

// vide les lignes pleines et ajoute les points (voir lineClearScore). Le combo monte ici,
// mais ne redescend jamais dans cette fonction — ça se décide en fin de lot, dans placePiece.
function supprimerLignesPleines(etat) {
    const { grille } = etat;
    const { lignes: lignesPleines, colonnes: colonnesPleines } = chercherLignesPleines(etat);

    const nbLignes = lignesPleines.length + colonnesPleines.length;
    if (nbLignes === 0) {
        return etat;
    }

    const nouvelleGrille = grilleSansLignes(grille, { lignes: lignesPleines, colonnes: colonnesPleines });

    const points = pointsDeSuppression(nbLignes, etat.combo);

    return ajouterPoints(
        { ...etat, grille: nouvelleGrille, combo: etat.combo + 1, ligneCasseeDansLeLot: true },
        points
    );
}