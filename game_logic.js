// définition des formes, en coordonnées [ligne, colonne] à partir du coin haut-gauche (0, 0)
// toute forme touche la ligne 0 et la colonne 0 : c'est ce qui permet de calculer sa taille avec un simple maximum
// les cases n'ont pas besoin d'être collées, ce qui donne les diagonales sans code particulier
// les tailles sont notées lignes x colonnes, comme les coordonnées
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

// nombre de pièces proposées au joueur en même temps
const PIECES_PAR_LOT = 3;

function etatAvec(etat, changements) {
    return { ...etat, ...changements };
}

function casesDeLaForme(forme, ligne, colonne) {
    const cases = [];

    // chaque case de la forme est décalée du coin haut-gauche où on la pose
    for (const [decalageLigne, decalageColonne] of FORMES[forme]) {
        cases.push([ligne + decalageLigne, colonne + decalageColonne]);
    }
    return cases;
}

function tailleDeLaForme(forme) {
    let maxLigne = 0;
    let maxColonne = 0;

    for (const [ligne, colonne] of FORMES[forme]) {
        if (ligne > maxLigne) maxLigne = ligne;
        if (colonne > maxColonne) maxColonne = colonne;
    }
    // +1 parce que les indices commencent à 0 : un indice maximum de 2 fait 3 cases
    return { lignes: maxLigne + 1, colonnes: maxColonne + 1 };
}

function creerGrilleVide(taille) {
    const grille = [];

    for (let ligne = 0; ligne < taille; ligne++) {
        grille.push([]);
        for (let colonne = 0; colonne < taille; colonne++) {
            grille[ligne].push(0);
        }
    }
    return grille;
}

function copierGrille(grille) {
    const copie = [];

    for (const ligne of grille) {
        // slice() sans argument renvoie une copie de la ligne, et non la ligne elle-même
        copie.push(ligne.slice());
    }
    return copie;
}

function grilleEstVide(grille) {
    for (let ligne = 0; ligne < grille.length; ligne++) {
        for (let colonne = 0; colonne < grille.length; colonne++) {
            if (grille[ligne][colonne] !== 0) return false;
        }
    }
    return true;
}

function grilleAvecForme(grille, forme, ligne, colonne, valeur) {
    const nouvelle = copierGrille(grille);

    for (const [l, c] of casesDeLaForme(forme, ligne, colonne)) {
        nouvelle[l][c] = valeur;
    }
    return nouvelle;
}

function grilleSansLignes(grille, pleines) {
    const taille = grille.length;
    const nouvelle = copierGrille(grille);

    // on vide chaque ligne pleine, de gauche à droite
    for (const ligne of pleines.lignes) {
        for (let colonne = 0; colonne < taille; colonne++) {
            nouvelle[ligne][colonne] = 0;
        }
    }
    // puis chaque colonne pleine, de haut en bas
    for (const colonne of pleines.colonnes) {
        for (let ligne = 0; ligne < taille; ligne++) {
            nouvelle[ligne][colonne] = 0;
        }
    }
    return nouvelle;
}

function lignePleine(grille, ligne) {
    for (let colonne = 0; colonne < grille.length; colonne++) {
        if (grille[ligne][colonne] === 0) return false;
    }
    return true;
}

function colonnePleine(grille, colonne) {
    for (let ligne = 0; ligne < grille.length; ligne++) {
        if (grille[ligne][colonne] === 0) return false;
    }
    return true;
}

function chercherLignesPleines(grille) {
    const lignes = [];
    const colonnes = [];

    for (let ligne = 0; ligne < grille.length; ligne++) {
        if (lignePleine(grille, ligne)) lignes.push(ligne);
    }
    for (let colonne = 0; colonne < grille.length; colonne++) {
        if (colonnePleine(grille, colonne)) colonnes.push(colonne);
    }
    return { lignes, colonnes };
}

function peutPoser(grille, forme, ligne, colonne) {
    const taille = grille.length;

    for (const [l, c] of casesDeLaForme(forme, ligne, colonne)) {
        // la case sort de la grille
        if (l < 0 || l >= taille || c < 0 || c >= taille) return false;
        // la case est déjà occupée
        if (grille[l][c] !== 0) return false;
    }
    return true;
}

function peutPoserQuelquePart(grille, forme) {
    for (let ligne = 0; ligne < grille.length; ligne++) {
        for (let colonne = 0; colonne < grille.length; colonne++) {
            if (peutPoser(grille, forme, ligne, colonne)) return true;
        }
    }
    return false;
}

function lignesCasseesPar(grille, forme, ligne, colonne) {
    if (!peutPoser(grille, forme, ligne, colonne)) {
        return { lignes: [], colonnes: [] };
    }
    // la couleur n'a aucune importance ici, on écrit 1 pour marquer les cases occupées
    return chercherLignesPleines(grilleAvecForme(grille, forme, ligne, colonne, 1));
}

function grilleApresPose(grille, forme, ligne, colonne) {
    const remplie = grilleAvecForme(grille, forme, ligne, colonne, 1);
    return grilleSansLignes(remplie, chercherLignesPleines(remplie));
}

// barème, approximation non officielle du jeu original :
//      score = 30 x L! x min(combo + 1, 6 x L)
// où L est le nombre de lignes et colonnes cassées du même coup, et combo le nombre de lots d'affilée qui ont cassé
// une ligne. Non couvert : le bonus quand la grille se vide entièrement.
const POINTS_PAR_LIGNE = 30;
const PLAFOND_COMBO_PAR_LIGNE = 6;

// une pièce casse au plus 6 lignes d'un coup : 5 lignes plus 1 colonne avec une ligne5, ou 3 plus 3 avec un carré 3x3
// la borne évite que la factorielle s'emballe si une forme plus grosse était ajoutée un jour
const MAX_LIGNES_COMPTEES = 6;

function factorielle(n) {
    let resultat = 1;

    for (let i = 2; i <= n; i++) {
        resultat *= i;
    }
    return resultat;
}

function pointsDeSuppression(nbLignes, combo) {
    const lignes = Math.min(nbLignes, MAX_LIGNES_COMPTEES);
    const multiplicateur = Math.min(combo + 1, PLAFOND_COMBO_PAR_LIGNE * lignes);

    return POINTS_PAR_LIGNE * factorielle(lignes) * multiplicateur;
}

// un lot sur trois est composé de trois fois la même forme quand la grille est vide, contre 3 % en cours de partie
// c'est le comportement du jeu original
const CHANCE_TRIPLE_GRILLE_VIDE = 1 / 3;
const CHANCE_TRIPLE_EN_JEU = 0.03;

// les grosses formes sortent plus souvent, là aussi comme dans le jeu original
const GROSSES_FORMES = ["carre_3x3", "rect_2x3", "rect_3x2"];
const POIDS_GROSSE_FORME = 5;

// nombre d'essais avant d'abandonner la garantie d'un lot entièrement posable
const MAX_ESSAIS_LOT = 40;

function construireSacDeFormes(formes) {
    const sac = [];

    for (const forme of formes) {
        const exemplaires = GROSSES_FORMES.includes(forme) ? POIDS_GROSSE_FORME : 1;
        for (let i = 0; i < exemplaires; i++) {
            sac.push(forme);
        }
    }
    return sac;
}

function tirerAuHasard(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
}

// numérotation des pièces : chaque pièce a besoin d'un identifiant unique pour que l'affichage sache laquelle est
// glissée, et un simple compteur suffit
let prochainNumeroDePiece = 1;

function creerPieces(nombre, sac, nbCouleurs, chanceTriple) {
    // tirée une fois pour tout le lot : si elle n'est pas nulle, toutes les pièces prennent cette forme
    let formeCommune = null;
    if (Math.random() < chanceTriple) {
        formeCommune = tirerAuHasard(sac);
    }

    const pieces = [];
    for (let i = 0; i < nombre; i++) {
        pieces.push({
            id: `piece-${prochainNumeroDePiece}`,
            forme: formeCommune !== null ? formeCommune : tirerAuHasard(sac),
            couleur: Math.floor(Math.random() * nbCouleurs),
        });
        prochainNumeroDePiece++;
    }
    return pieces;
}

function peutToutPoserDansUnOrdre(grille, formes) {
    // plus rien à poser : toutes les formes ont trouvé leur place
    if (formes.length === 0) return true;

    const dejaEssayees = [];

    for (let index = 0; index < formes.length; index++) {
        const forme = formes[index];

        // deux pièces identiques mèneraient exactement au même essai
        if (dejaEssayees.includes(forme)) continue;
        dejaEssayees.push(forme);

        // ce qu'il restera à poser si on pose celle-ci maintenant
        const restantes = formes.slice();
        restantes.splice(index, 1);

        for (let ligne = 0; ligne < grille.length; ligne++) {
            for (let colonne = 0; colonne < grille.length; colonne++) {
                if (!peutPoser(grille, forme, ligne, colonne)) continue;

                const grilleSuivante = grilleApresPose(grille, forme, ligne, colonne);
                if (peutToutPoserDansUnOrdre(grilleSuivante, restantes)) return true;
            }
        }
    }

    // aucune forme, à aucun endroit, ne mène à une solution
    return false;
}

function tirerLotPosable(etat, nombre) {
    const grille = etat.grille;

    // formes qui rentrent encore quelque part, calculées une seule fois puisque la grille ne change pas entre
    // deux essais
    const posables = [];
    for (const forme of Object.keys(FORMES)) {
        if (peutPoserQuelquePart(grille, forme)) posables.push(forme);
    }

    const sac = construireSacDeFormes(posables.length > 0 ? posables : Object.keys(FORMES));
    const chanceTriple = grilleEstVide(grille) ? CHANCE_TRIPLE_GRILLE_VIDE : CHANCE_TRIPLE_EN_JEU;

    let pieces;
    for (let essai = 0; essai < MAX_ESSAIS_LOT; essai++) {
        pieces = creerPieces(nombre, sac, etat.nbCouleurs, chanceTriple);

        const formes = [];
        for (const piece of pieces) {
            formes.push(piece.forme);
        }
        if (peutToutPoserDansUnOrdre(grille, formes)) return pieces;
    }
    return pieces;
}

function creerEtatInitial(taille = 8, nbCouleurs = 4) {
    const etatVide = {
        taille: taille,
        nbCouleurs: nbCouleurs,
        grille: creerGrilleVide(taille),
        score: 0,
        combo: 0,
        // passe à true dès qu'une ligne saute dans le lot en cours, et décide en fin de lot si le combo est conservé
        ligneCasseeDansLeLot: false,
        pieces: [],
    };
    return etatAvec(etatVide, { pieces: tirerLotPosable(etatVide, PIECES_PAR_LOT) });
}

function trouverPiece(pieces, id) {
    for (const piece of pieces) {
        if (piece.id === id) return piece;
    }
    return null;
}

function supprimerLignesPleines(etat) {
    const pleines = chercherLignesPleines(etat.grille);
    const nbLignes = pleines.lignes.length + pleines.colonnes.length;

    // rien de plein : l'état ne change pas
    if (nbLignes === 0) return etat;

    return etatAvec(etat, {
        grille: grilleSansLignes(etat.grille, pleines),
        score: etat.score + pointsDeSuppression(nbLignes, etat.combo),
        combo: etat.combo + 1,
        ligneCasseeDansLeLot: true,
    });
}

function poserPiece(etat, idPiece, ligne, colonne) {
    const piece = trouverPiece(etat.pieces, idPiece);
    if (piece === null || !peutPoser(etat.grille, piece.forme, ligne, colonne)) {
        return etat;
    }

    // la réserve sans la pièce qu'on vient de poser
    const reserve = [];
    for (const autre of etat.pieces) {
        if (autre.id !== idPiece) reserve.push(autre);
    }

    // 1. la pièce est dessinée sur la grille et rapporte un point par case occupée
    //    on écrit couleur + 1 parce que 0 est réservé aux cases vides
    const posee = etatAvec(etat, {
        grille: grilleAvecForme(etat.grille, piece.forme, ligne, colonne, piece.couleur + 1),
        pieces: reserve,
        score: etat.score + FORMES[piece.forme].length,
    });

    // 2. les lignes et colonnes devenues pleines sautent et rapportent leurs points
    const nettoye = supprimerLignesPleines(posee);

    // 3. il reste des pièces dans la réserve : le lot n'est pas fini, on s'arrête là
    if (nettoye.pieces.length > 0) return nettoye;

    // 4. fin de lot : le combo ne retombe à 0 que si aucune des 3 pièces n'a cassé de ligne
    //    le lot suivant est tiré sur la grille telle qu'elle sera affichée au joueur
    return etatAvec(nettoye, {
        combo: nettoye.ligneCasseeDansLeLot ? nettoye.combo : 0,
        ligneCasseeDansLeLot: false,
        pieces: tirerLotPosable(nettoye, PIECES_PAR_LOT),
    });
}

function partieTerminee(etat) {
    for (const piece of etat.pieces) {
        if (peutPoserQuelquePart(etat.grille, piece.forme)) return false;
    }
    return true;
}

function basculerCase(etat, ligne, colonne) {
    const grille = copierGrille(etat.grille);
    grille[ligne][colonne] = grille[ligne][colonne] === 0 ? 1 : 0;

    return etatAvec(etat, { grille: grille });
}

// rend les fonctions accessibles aux tests exécutés avec Node
// dans le navigateur la variable "module" n'existe pas, la ligne est donc simplement ignorée
if (typeof module !== "undefined") {
    module.exports = {
        FORMES, GROSSES_FORMES, PIECES_PAR_LOT,
        casesDeLaForme, tailleDeLaForme,
        creerGrilleVide, copierGrille, chercherLignesPleines, peutPoser, peutPoserQuelquePart,
        lignesCasseesPar, peutToutPoserDansUnOrdre, construireSacDeFormes,
        pointsDeSuppression, creerEtatInitial, poserPiece, partieTerminee, basculerCase,
    };
}
