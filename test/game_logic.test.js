// programme: Block Blast tests de la logique
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 10.09.2026
// Version: V.3.0
// dernière modif: 08.10.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tests des règles du jeu, exécutés avec "npm test". Ils ne touchent qu'à game_logic.js : l'affichage a besoin d'un
// navigateur et n'est donc pas testé ici.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const test = require("node:test");
const assert = require("node:assert/strict");

const { Forme, Grille, Bareme, Tirage, Partie } = require("../game_logic.js");

/**
 * fabrique une partie de test à partir d'une grille et de pièces choisies
 * :param grille: la grille voulue
 * :param pieces: la réserve voulue
 * :param extra: champs supplémentaires à remplacer, par exemple le combo
 * :return: une Partie prête à jouer
 */
function partieDeTest(grille, pieces, extra = {}) {
    const partie = new Partie(grille.taille);
    partie.grille = grille;
    partie.pieces = pieces;
    for (const champ of Object.keys(extra)) {
        partie[champ] = extra[champ];
    }
    return partie;
}

/**
 * fabrique une grille dont la première ligne est pleine sauf sa dernière case
 * :return: une grille 8x8
 */
function grilleLignePresquePleine() {
    const grille = new Grille(8);

    for (let colonne = 0; colonne < 7; colonne++) {
        grille.ecrireCase(0, colonne, 1);
    }
    return grille;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// formes
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("toute forme touche la ligne 0 et la colonne 0", () => {
    for (const nom of Forme.listerNoms()) {
        const cases = Forme.trouverParNom(nom).cases;
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

    for (const nom of Forme.listerNoms()) {
        const cases = Forme.trouverParNom(nom).cases;
        // on trie pour que deux définitions identiques écrites dans un ordre différent se ressemblent
        const cle = cases.map((caseForme) => caseForme.join(",")).sort().join(" ");
        assert.equal(vues.get(cle), undefined, `${nom} est identique à ${vues.get(cle)}`);
        vues.set(cle, nom);
    }
});

test("les grosses formes existent bien", () => {
    for (const nom of Tirage.GROSSES_FORMES) {
        assert.ok(Forme.trouverParNom(nom), `forme inconnue : ${nom}`);
    }
});

test("taille() donne les dimensions en lignes et colonnes", () => {
    assert.deepEqual(Forme.trouverParNom("bloc").calculerTaille(), { lignes: 1, colonnes: 1 });
    assert.deepEqual(Forme.trouverParNom("ligne5_h").calculerTaille(), { lignes: 1, colonnes: 5 });
    assert.deepEqual(Forme.trouverParNom("rect_2x3").calculerTaille(), { lignes: 2, colonnes: 3 });
    assert.deepEqual(Forme.trouverParNom("rect_3x2").calculerTaille(), { lignes: 3, colonnes: 2 });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// grille
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("une pièce ne peut pas dépasser de la grille", () => {
    const grille = new Grille(8);

    assert.equal(grille.peutPoser("ligne5_h", 0, 4), false);
    assert.equal(grille.peutPoser("ligne5_h", 0, 3), true);
    assert.equal(grille.peutPoser("bloc", -1, 0), false);
});

test("une pièce ne peut pas recouvrir une case occupée", () => {
    const grille = new Grille(8);
    grille.ecrireCase(1, 1, 2);

    assert.equal(grille.peutPoser("carre_2x2", 0, 0), false);
    assert.equal(grille.peutPoser("carre_2x2", 2, 2), true);
});

test("chercherLignesPleines trouve les lignes et les colonnes pleines", () => {
    const grille = new Grille(8);

    for (let colonne = 0; colonne < 8; colonne++) grille.ecrireCase(3, colonne, 1);
    for (let ligne = 0; ligne < 8; ligne++) grille.ecrireCase(ligne, 5, 1);

    assert.deepEqual(grille.chercherLignesPleines(), { lignes: [3], colonnes: [5] });
});

test("une copie de grille est indépendante de l'originale", () => {
    const grille = new Grille(8);
    const copie = grille.copier();
    copie.ecrireCase(2, 3, 1);

    assert.equal(copie.lireCase(2, 3), 1);
    assert.equal(grille.lireCase(2, 3), 0, "l'originale ne doit pas bouger");
});

test("chercherLignesCasseesPar ne renvoie rien si la pose est impossible", () => {
    const grille = new Grille(8);
    grille.ecrireCase(0, 0, 1);

    assert.deepEqual(grille.chercherLignesCasseesPar("bloc", 0, 0), { lignes: [], colonnes: [] });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pose d'une pièce
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("poser une pièce rapporte un point par case", () => {
    const partie = partieDeTest(new Grille(8), [{ id: "p1", forme: "carre_2x2", couleur: 0 }]);

    assert.equal(partie.poserPiece("p1", 0, 0), true);
    assert.equal(partie.score, 4);
});

test("une pièce posée quitte la réserve", () => {
    const partie = partieDeTest(new Grille(8), [
        { id: "p1", forme: "bloc", couleur: 0 },
        { id: "p2", forme: "bloc", couleur: 0 },
    ]);

    partie.poserPiece("p1", 0, 0);

    assert.equal(partie.trouverPiece("p1"), null);
    assert.equal(partie.pieces.length, 1);
});

test("compléter une ligne la vide et rapporte les points de suppression", () => {
    const partie = partieDeTest(grilleLignePresquePleine(), [{ id: "p1", forme: "bloc", couleur: 0 }]);
    partie.poserPiece("p1", 0, 7);

    for (let colonne = 0; colonne < 8; colonne++) {
        assert.equal(partie.grille.lireCase(0, colonne), 0, "la ligne aurait dû être vidée");
    }
    assert.equal(partie.score, 1 + Bareme.calculerPoints(1, 0));
    assert.equal(partie.combo, 1);
});

test("une pose impossible ne change rien à la partie", () => {
    const partie = partieDeTest(new Grille(8), [{ id: "p1", forme: "ligne5_h", couleur: 0 }]);
    const avant = JSON.stringify(partie);

    assert.equal(partie.poserPiece("p1", 0, 6), false, "la pièce dépasse de la grille");
    assert.equal(partie.poserPiece("inconnue", 0, 0), false, "la pièce n'existe pas");
    assert.equal(JSON.stringify(partie), avant);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// combo et score
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("le combo retombe à zéro si aucune pièce du lot n'a cassé de ligne", () => {
    const partie = partieDeTest(new Grille(8), [{ id: "p1", forme: "bloc", couleur: 0 }], {
        combo: 3,
        ligneCasseeDansLeLot: false,
    });

    partie.poserPiece("p1", 4, 4);

    assert.equal(partie.combo, 0);
});

test("le combo tient si une pièce du lot a cassé une ligne", () => {
    const partie = partieDeTest(grilleLignePresquePleine(), [
        { id: "p1", forme: "bloc", couleur: 0 },
        { id: "p2", forme: "bloc", couleur: 0 },
    ]);

    partie.poserPiece("p1", 0, 7); // casse la ligne
    assert.equal(partie.combo, 1);

    partie.poserPiece("p2", 4, 4); // ne casse rien, mais termine le lot
    assert.equal(partie.combo, 1);
});

test("le barème suit la formule annoncée et reste borné", () => {
    assert.equal(Bareme.calculerPoints(1, 0), 30);
    assert.equal(Bareme.calculerPoints(2, 0), 60);
    assert.equal(Bareme.calculerPoints(2, 5), 360);
    assert.equal(Bareme.calculerPoints(20, 0), Bareme.calculerPoints(6, 0));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tirage et fin de partie
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

test("les grosses formes sortent plus souvent du sac", () => {
    const sac = Tirage.construireSac(["bloc", "carre_3x3"]);

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
        const partie = new Partie(8);
        const formes = partie.pieces.map((piece) => piece.forme);

        assert.equal(partie.pieces.length, Partie.PIECES_PAR_LOT);
        assert.ok(
            Tirage.peutToutPoserDansUnOrdre(partie.grille, formes),
            "le lot de départ devrait être entièrement posable"
        );
    }
});

test("la partie est finie quand plus aucune pièce ne rentre", () => {
    const pleine = new Grille(8);
    for (let ligne = 0; ligne < 8; ligne++) {
        for (let colonne = 0; colonne < 8; colonne++) pleine.ecrireCase(ligne, colonne, 1);
    }
    pleine.ecrireCase(0, 0, 0);

    assert.equal(partieDeTest(pleine, [{ id: "p1", forme: "carre_2x2", couleur: 0 }]).estTerminee(), true);
    assert.equal(partieDeTest(pleine.copier(), [{ id: "p1", forme: "bloc", couleur: 0 }]).estTerminee(), false);
});

test("basculerCase remplit puis vide une case", () => {
    const partie = partieDeTest(new Grille(8), []);

    partie.basculerCase(2, 3);
    assert.equal(partie.grille.lireCase(2, 3), 1);

    partie.basculerCase(2, 3);
    assert.equal(partie.grille.lireCase(2, 3), 0);
});
