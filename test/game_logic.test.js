// programme: Block Blast tests de la logique
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 10.09.2026
// Version: V.2.0
// dernière modif: 10.09.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tests des règles du jeu, exécutés avec "npm test". Ils ne touchent qu'à game_logic.js : l'affichage a besoin d'un
// navigateur et n'est donc pas testé ici.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    FORMES, GROSSES_FORMES, PIECES_PAR_LOT,
    tailleDeLaForme, creerGrilleVide, chercherLignesPleines, peutPoser,
    lignesCasseesPar, peutToutPoserDansUnOrdre, construireSacDeFormes,
    pointsDeSuppression, creerEtatInitial, poserPiece, partieTerminee, basculerCase,
} = require("../game_logic.js");

/**
 * fabrique un état de test à partir d'une grille et de pièces choisies
 * :param grille: la grille voulue
 * :param pieces: la réserve voulue
 * :param extra: champs supplémentaires à remplacer, par exemple le combo
 * :return: un état complet, prêt à passer à poserPiece
 */
function etatDeTest(grille, pieces, extra = {}) {
    return { ...creerEtatInitial(grille.length), grille, pieces, ...extra };
}

/**
 * fabrique une grille dont la première ligne est pleine sauf sa dernière case
 * :return: une grille 8x8
 */
function grilleLignePresquePleine() {
    const grille = creerGrilleVide(8);

    for (let colonne = 0; colonne < 7; colonne++) {
        grille[0][colonne] = 1;
    }
    return grille;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// formes
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("toute forme touche la ligne 0 et la colonne 0", () => {
    for (const [nom, cases] of Object.entries(FORMES)) {
        let minLigne = 99;
        let minColonne = 99;

        for (const [ligne, colonne] of cases) {
            if (ligne < minLigne) minLigne = ligne;
            if (colonne < minColonne) minColonne = colonne;
        }
        assert.equal(minLigne, 0, `${nom} : aucune case en ligne 0`);
        assert.equal(minColonne, 0, `${nom} : aucune case en colonne 0`);
    }
});

test("aucune forme n'est définie deux fois", () => {
    const vues = new Map();

    for (const [nom, cases] of Object.entries(FORMES)) {
        // on trie pour que deux définitions identiques écrites dans un ordre différent se ressemblent
        const cle = cases.map((c) => c.join(",")).sort().join(" ");
        assert.equal(vues.get(cle), undefined, `${nom} est identique à ${vues.get(cle)}`);
        vues.set(cle, nom);
    }
});

test("les grosses formes existent bien", () => {
    for (const nom of GROSSES_FORMES) {
        assert.ok(FORMES[nom], `forme inconnue : ${nom}`);
    }
});

test("tailleDeLaForme donne les dimensions en lignes et colonnes", () => {
    assert.deepEqual(tailleDeLaForme("bloc"), { lignes: 1, colonnes: 1 });
    assert.deepEqual(tailleDeLaForme("ligne5_h"), { lignes: 1, colonnes: 5 });
    assert.deepEqual(tailleDeLaForme("rect_2x3"), { lignes: 2, colonnes: 3 });
    assert.deepEqual(tailleDeLaForme("rect_3x2"), { lignes: 3, colonnes: 2 });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// grille
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("une pièce ne peut pas dépasser de la grille", () => {
    const grille = creerGrilleVide(8);

    assert.equal(peutPoser(grille, "ligne5_h", 0, 4), false);
    assert.equal(peutPoser(grille, "ligne5_h", 0, 3), true);
    assert.equal(peutPoser(grille, "bloc", -1, 0), false);
});

test("une pièce ne peut pas recouvrir une case occupée", () => {
    const grille = creerGrilleVide(8);
    grille[1][1] = 2;

    assert.equal(peutPoser(grille, "carre_2x2", 0, 0), false);
    assert.equal(peutPoser(grille, "carre_2x2", 2, 2), true);
});

test("chercherLignesPleines trouve les lignes et les colonnes pleines", () => {
    const grille = creerGrilleVide(8);

    for (let colonne = 0; colonne < 8; colonne++) grille[3][colonne] = 1;
    for (let ligne = 0; ligne < 8; ligne++) grille[ligne][5] = 1;

    assert.deepEqual(chercherLignesPleines(grille), { lignes: [3], colonnes: [5] });
});

test("lignesCasseesPar ne renvoie rien si la pose est impossible", () => {
    const grille = creerGrilleVide(8);
    grille[0][0] = 1;

    assert.deepEqual(lignesCasseesPar(grille, "bloc", 0, 0), { lignes: [], colonnes: [] });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pose d'une pièce
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("poser une pièce rapporte un point par case", () => {
    const etat = etatDeTest(creerGrilleVide(8), [{ id: "p1", forme: "carre_2x2", couleur: 0 }]);

    assert.equal(poserPiece(etat, "p1", 0, 0).score, 4);
});

test("compléter une ligne la vide et rapporte les points de suppression", () => {
    const etat = etatDeTest(grilleLignePresquePleine(), [{ id: "p1", forme: "bloc", couleur: 0 }]);
    const suivant = poserPiece(etat, "p1", 0, 7);

    for (let colonne = 0; colonne < 8; colonne++) {
        assert.equal(suivant.grille[0][colonne], 0, "la ligne aurait dû être vidée");
    }
    assert.equal(suivant.score, 1 + pointsDeSuppression(1, 0));
    assert.equal(suivant.combo, 1);
});

test("une pose impossible laisse l'état inchangé", () => {
    const etat = etatDeTest(creerGrilleVide(8), [{ id: "p1", forme: "ligne5_h", couleur: 0 }]);

    assert.equal(poserPiece(etat, "p1", 0, 6), etat);
    assert.equal(poserPiece(etat, "inconnue", 0, 0), etat);
});

test("poserPiece ne modifie jamais l'état reçu", () => {
    const etat = etatDeTest(grilleLignePresquePleine(), [{ id: "p1", forme: "bloc", couleur: 0 }]);
    const avant = JSON.stringify(etat);

    poserPiece(etat, "p1", 0, 7);

    assert.equal(JSON.stringify(etat), avant);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// combo et score
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("le combo retombe à zéro si aucune pièce du lot n'a cassé de ligne", () => {
    const etat = etatDeTest(creerGrilleVide(8), [{ id: "p1", forme: "bloc", couleur: 0 }], {
        combo: 3,
        ligneCasseeDansLeLot: false,
    });

    assert.equal(poserPiece(etat, "p1", 4, 4).combo, 0);
});

test("le combo tient si une pièce du lot a cassé une ligne", () => {
    let etat = etatDeTest(grilleLignePresquePleine(), [
        { id: "p1", forme: "bloc", couleur: 0 },
        { id: "p2", forme: "bloc", couleur: 0 },
    ]);

    etat = poserPiece(etat, "p1", 0, 7); // casse la ligne
    assert.equal(etat.combo, 1);

    etat = poserPiece(etat, "p2", 4, 4); // ne casse rien, mais termine le lot
    assert.equal(etat.combo, 1);
});

test("le barème suit la formule annoncée et reste borné", () => {
    assert.equal(pointsDeSuppression(1, 0), 30);
    assert.equal(pointsDeSuppression(2, 0), 60);
    assert.equal(pointsDeSuppression(2, 5), 360);
    assert.equal(pointsDeSuppression(20, 0), pointsDeSuppression(6, 0));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tirage et fin de partie
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("les grosses formes sortent plus souvent du sac", () => {
    const sac = construireSacDeFormes(["bloc", "carre_3x3"]);

    let nbBloc = 0;
    let nbCarre = 0;
    for (const forme of sac) {
        if (forme === "bloc") nbBloc++;
        if (forme === "carre_3x3") nbCarre++;
    }
    assert.equal(nbBloc, 1);
    assert.equal(nbCarre, 5);
});

test("le lot tiré est toujours posable en entier", () => {
    for (let essai = 0; essai < 20; essai++) {
        const etat = creerEtatInitial(8);
        const formes = etat.pieces.map((piece) => piece.forme);

        assert.equal(etat.pieces.length, PIECES_PAR_LOT);
        assert.ok(
            peutToutPoserDansUnOrdre(etat.grille, formes),
            "le lot de départ devrait être entièrement posable"
        );
    }
});

test("la partie est finie quand plus aucune pièce ne rentre", () => {
    const pleine = creerGrilleVide(8);
    for (let ligne = 0; ligne < 8; ligne++) {
        for (let colonne = 0; colonne < 8; colonne++) pleine[ligne][colonne] = 1;
    }
    pleine[0][0] = 0;

    assert.equal(partieTerminee(etatDeTest(pleine, [{ id: "p1", forme: "carre_2x2", couleur: 0 }])), true);
    assert.equal(partieTerminee(etatDeTest(pleine, [{ id: "p1", forme: "bloc", couleur: 0 }])), false);
});

test("basculerCase remplit puis vide une case", () => {
    const etat = etatDeTest(creerGrilleVide(8), []);

    const remplie = basculerCase(etat, 2, 3);
    assert.equal(remplie.grille[2][3], 1);
    assert.equal(etat.grille[2][3], 0, "l'état d'origine ne doit pas bouger");

    assert.equal(basculerCase(remplie, 2, 3).grille[2][3], 0);
});
