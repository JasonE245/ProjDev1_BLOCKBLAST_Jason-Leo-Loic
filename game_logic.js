// programme: Block Blast section logique
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 18.08.2026
// Version: V.3.0
// dernière modif: 08.10.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ce fichier contient les règles du jeu. Aucune classe ici ne touche à l'affichage.
//
// Forme, Bareme et Tirage ne changent jamais. Grille et Partie, elles, se modifient au fil du jeu : leurs méthodes
// changent l'objet lui-même. Règle à respecter : seule la classe Jeu (main.js) appelle les méthodes qui modifient la
// partie, l'affichage ne fait que la lire.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// une forme est une liste de cases en coordonnées [ligne, colonne] à partir du coin haut-gauche (0, 0)
// toute forme touche la ligne 0 et la colonne 0 : c'est ce qui permet de calculer sa taille avec un simple maximum
// les cases n'ont pas besoin d'être collées, ce qui donne les diagonales sans code particulier
// les tailles sont notées lignes x colonnes, comme les coordonnées
//
// les pièces et l'état du jeu ne retiennent que le nom de la forme (une simple chaîne) : on retrouve l'objet Forme
// correspondant avec Forme.trouverParNom()
class Forme {
    /**
     * :param cases: liste de couples [ligne, colonne] relatifs au coin haut-gauche de la forme
     */
    constructor(cases) {
        this.cases = cases;
    }

    /**
     * nombre de cases de la forme, qui est aussi le nombre de points qu'elle rapporte une fois posée
     */
    get nbCases() {
        return this.cases.length;
    }

    /**
     * calcule la taille du rectangle qui contient la forme
     * comme toute forme touche la ligne 0 et la colonne 0, le plus grand indice suffit
     * :return: un objet {lignes, colonnes}
     */
    calculerTaille() {
        let maxLigne = 0;
        let maxColonne = 0;

        for (const [ligne, colonne] of this.cases) {
            if (ligne > maxLigne) maxLigne = ligne;
            if (colonne > maxColonne) maxColonne = colonne;
        }
        // +1 parce que les indices commencent à 0 : un indice maximum de 2 fait 3 cases
        return { lignes: maxLigne + 1, colonnes: maxColonne + 1 };
    }

    /**
     * calcule les cases réellement occupées par la forme posée à un endroit donné
     * :param ligne: ligne du coin haut-gauche de la forme
     * :param colonne: colonne du coin haut-gauche de la forme
     * :return: liste de couples [ligne, colonne] en coordonnées de la grille
     */
    calculerCasesPosees(ligne, colonne) {
        const cases = [];

        // chaque case de la forme est décalée du coin haut-gauche où on la pose
        for (const [decalageLigne, decalageColonne] of this.cases) {
            cases.push([ligne + decalageLigne, colonne + decalageColonne]);
        }
        return cases;
    }

    /**
     * retrouve une forme à partir de son nom
     * :param nom: nom de la forme, tel qu'il apparaît dans Forme.TOUTES
     * :return: l'objet Forme correspondant
     */
    static trouverParNom(nom) {
        return Forme.TOUTES[nom];
    }

    /**
     * :return: la liste des noms de toutes les formes
     */
    static listerNoms() {
        return Object.keys(Forme.TOUTES);
    }
}

// catalogue de toutes les formes du jeu, rangées par nom
// il est rempli après la classe, parce que chaque entrée a besoin que Forme soit déjà définie
Forme.TOUTES = {
    bloc: new Forme([[0, 0]]),

    ligne2_h: new Forme([[0, 0], [0, 1]]),
    ligne2_v: new Forme([[0, 0], [1, 0]]),
    ligne3_h: new Forme([[0, 0], [0, 1], [0, 2]]),
    ligne3_v: new Forme([[0, 0], [1, 0], [2, 0]]),
    ligne4_h: new Forme([[0, 0], [0, 1], [0, 2], [0, 3]]),
    ligne4_v: new Forme([[0, 0], [1, 0], [2, 0], [3, 0]]),
    ligne5_h: new Forme([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]),
    ligne5_v: new Forme([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),

    coin_0: new Forme([[0, 0], [0, 1], [1, 0]]),
    coin_90: new Forme([[0, 0], [0, 1], [1, 1]]),
    coin_180: new Forme([[0, 1], [1, 0], [1, 1]]),
    coin_270: new Forme([[0, 0], [1, 0], [1, 1]]),

    carre_2x2: new Forme([[0, 0], [0, 1], [1, 0], [1, 1]]),
    carre_3x3: new Forme([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]),
    rect_2x3: new Forme([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]),
    rect_3x2: new Forme([[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]),

    l_0: new Forme([[0, 0], [1, 0], [2, 0], [2, 1]]),
    l_90: new Forme([[0, 0], [0, 1], [0, 2], [1, 0]]),
    l_180: new Forme([[0, 0], [0, 1], [1, 1], [2, 1]]),
    l_270: new Forme([[0, 2], [1, 0], [1, 1], [1, 2]]),

    j_0: new Forme([[0, 1], [1, 1], [2, 0], [2, 1]]),
    j_90: new Forme([[0, 0], [1, 0], [1, 1], [1, 2]]),
    j_180: new Forme([[0, 0], [0, 1], [1, 0], [2, 0]]),
    j_270: new Forme([[0, 0], [0, 1], [0, 2], [1, 2]]),

    t_0: new Forme([[0, 0], [0, 1], [0, 2], [1, 1]]),
    t_90: new Forme([[0, 1], [1, 0], [1, 1], [2, 1]]),
    t_180: new Forme([[0, 1], [1, 0], [1, 1], [1, 2]]),
    t_270: new Forme([[0, 0], [1, 0], [1, 1], [2, 0]]),

    s_h: new Forme([[0, 1], [0, 2], [1, 0], [1, 1]]),
    s_v: new Forme([[0, 0], [1, 0], [1, 1], [2, 1]]),
    z_h: new Forme([[0, 0], [0, 1], [1, 1], [1, 2]]),
    z_v: new Forme([[0, 1], [1, 0], [1, 1], [2, 0]]),

    grand_l_0: new Forme([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]),
    grand_l_90: new Forme([[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]]),
    grand_l_180: new Forme([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
    grand_l_270: new Forme([[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]]),

    diagonale2_montante: new Forme([[0, 1], [1, 0]]),
    diagonale2_descendante: new Forme([[0, 0], [1, 1]]),
    diagonale3_montante: new Forme([[0, 2], [1, 1], [2, 0]]),
    diagonale3_descendante: new Forme([[0, 0], [1, 1], [2, 2]]),
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// grille
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// la grille de jeu : un carré de cases qui valent 0 quand elles sont vides, et la couleur de la pièce posée (1 à 4)
// quand elles sont occupées
class Grille {
    /**
     * fabrique une grille carrée entièrement vide
     * :param taille: nombre de lignes, qui est aussi le nombre de colonnes
     */
    constructor(taille) {
        this.taille = taille;
        this.cases = [];

        for (let ligne = 0; ligne < taille; ligne++) {
            this.cases.push([]);
            for (let colonne = 0; colonne < taille; colonne++) {
                this.cases[ligne].push(0);
            }
        }
    }

    /**
     * lit la valeur d'une case
     * :param ligne: ligne de la case
     * :param colonne: colonne de la case
     * :return: 0 si la case est vide, sinon la couleur de la pièce posée (1 à 4)
     */
    lireCase(ligne, colonne) {
        return this.cases[ligne][colonne];
    }

    /**
     * écrit une valeur dans une case
     * :param ligne: ligne de la case
     * :param colonne: colonne de la case
     * :param valeur: 0 pour vider la case, 1 à 4 pour la remplir avec une couleur
     * :return: rien, la grille est modifiée
     */
    ecrireCase(ligne, colonne, valeur) {
        this.cases[ligne][colonne] = valeur;
    }

    /**
     * fabrique une copie indépendante de la grille
     * sans cette copie, écrire dans la nouvelle grille modifierait aussi l'ancienne
     * :return: une nouvelle Grille avec les mêmes valeurs
     */
    copier() {
        const copie = new Grille(this.taille);

        for (let ligne = 0; ligne < this.taille; ligne++) {
            for (let colonne = 0; colonne < this.taille; colonne++) {
                copie.ecrireCase(ligne, colonne, this.lireCase(ligne, colonne));
            }
        }
        return copie;
    }

    /**
     * vérifie si la grille ne contient plus aucune case occupée
     * :return: true si toutes les cases valent 0, sinon false
     */
    estVide() {
        for (let ligne = 0; ligne < this.taille; ligne++) {
            for (let colonne = 0; colonne < this.taille; colonne++) {
                if (this.lireCase(ligne, colonne) !== 0) return false;
            }
        }
        return true;
    }

    /**
     * vérifie si une forme peut être posée à un endroit précis
     * :param forme: nom de la forme à poser
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :return: true si toutes les cases de la forme sont dans la grille et vides, sinon false
     */
    peutPoser(forme, ligne, colonne) {
        for (const [ligneCase, colonneCase] of Forme.trouverParNom(forme).calculerCasesPosees(ligne, colonne)) {
            // la case sort de la grille
            if (ligneCase < 0 || ligneCase >= this.taille) return false;
            if (colonneCase < 0 || colonneCase >= this.taille) return false;
            // la case est déjà occupée
            if (this.lireCase(ligneCase, colonneCase) !== 0) return false;
        }
        return true;
    }

    /**
     * vérifie s'il existe au moins un endroit de la grille où la forme rentre
     * :param forme: nom de la forme à tester
     * :return: true si la forme rentre quelque part, sinon false
     */
    peutPoserQuelquePart(forme) {
        for (let ligne = 0; ligne < this.taille; ligne++) {
            for (let colonne = 0; colonne < this.taille; colonne++) {
                if (this.peutPoser(forme, ligne, colonne)) return true;
            }
        }
        return false;
    }

    /**
     * dessine une forme sur la grille, sans vérifier qu'elle rentre (c'est le rôle de peutPoser)
     * :param forme: nom de la forme à dessiner
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :param valeur: valeur à écrire dans les cases de la forme (1 à 4 = couleur)
     * :return: rien, la grille est modifiée
     */
    poserForme(forme, ligne, colonne, valeur) {
        for (const [ligneCase, colonneCase] of Forme.trouverParNom(forme).calculerCasesPosees(ligne, colonne)) {
            this.ecrireCase(ligneCase, colonneCase, valeur);
        }
    }

    /**
     * vérifie si une ligne de la grille est entièrement occupée
     * :param ligne: index de la ligne
     * :return: true si aucune case de la ligne ne vaut 0, sinon false
     */
    estLignePleine(ligne) {
        for (let colonne = 0; colonne < this.taille; colonne++) {
            if (this.lireCase(ligne, colonne) === 0) return false;
        }
        return true;
    }

    /**
     * vérifie si une colonne de la grille est entièrement occupée
     * :param colonne: index de la colonne
     * :return: true si aucune case de la colonne ne vaut 0, sinon false
     */
    estColonnePleine(colonne) {
        for (let ligne = 0; ligne < this.taille; ligne++) {
            if (this.lireCase(ligne, colonne) === 0) return false;
        }
        return true;
    }

    /**
     * cherche toutes les lignes et toutes les colonnes entièrement occupées
     * :return: un objet {lignes, colonnes} contenant leurs index
     */
    chercherLignesPleines() {
        const lignes = [];
        const colonnes = [];

        for (let ligne = 0; ligne < this.taille; ligne++) {
            if (this.estLignePleine(ligne)) lignes.push(ligne);
        }
        for (let colonne = 0; colonne < this.taille; colonne++) {
            if (this.estColonnePleine(colonne)) colonnes.push(colonne);
        }
        return { lignes, colonnes };
    }

    /**
     * vide les lignes et colonnes indiquées
     * :param pleines: objet {lignes, colonnes} contenant les index à vider
     * :return: rien, la grille est modifiée
     */
    viderLignes(pleines) {
        // on vide chaque ligne pleine, de gauche à droite
        for (const ligne of pleines.lignes) {
            for (let colonne = 0; colonne < this.taille; colonne++) {
                this.ecrireCase(ligne, colonne, 0);
            }
        }
        // puis chaque colonne pleine, de haut en bas
        for (const colonne of pleines.colonnes) {
            for (let ligne = 0; ligne < this.taille; ligne++) {
                this.ecrireCase(ligne, colonne, 0);
            }
        }
    }

    /**
     * calcule les lignes et colonnes qui sauteraient si on posait cette forme ici, sans rien poser
     * sert à l'aperçu affiché quand le joueur survole la grille avec une pièce
     * :param forme: nom de la forme
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :return: un objet {lignes, colonnes}, vide si la pose est impossible
     */
    chercherLignesCasseesPar(forme, ligne, colonne) {
        if (!this.peutPoser(forme, ligne, colonne)) {
            return { lignes: [], colonnes: [] };
        }
        // on fait l'essai sur une copie, pour ne pas toucher à la vraie grille
        // la couleur n'a aucune importance ici, on écrit 1 pour marquer les cases occupées
        const essai = this.copier();
        essai.poserForme(forme, ligne, colonne, 1);
        return essai.chercherLignesPleines();
    }

    /**
     * calcule la grille telle qu'elle serait après une pose, suppressions comprises, sans toucher à celle-ci
     * sert uniquement aux essais de tirage, où seule la place restante compte
     * :param forme: nom de la forme posée
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :return: une nouvelle Grille
     */
    simulerPose(forme, ligne, colonne) {
        const essai = this.copier();
        essai.poserForme(forme, ligne, colonne, 1);
        essai.viderLignes(essai.chercherLignesPleines());
        return essai;
    }

    /**
     * remplit une case vide ou vide une case pleine
     * sert au mode debug, pour préparer une situation à la main
     * :param ligne: ligne de la case
     * :param colonne: colonne de la case
     * :return: rien, la grille est modifiée
     */
    basculerCase(ligne, colonne) {
        this.ecrireCase(ligne, colonne, this.lireCase(ligne, colonne) === 0 ? 1 : 0);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// score
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// barème, approximation non officielle du jeu original :
//      score = 30 x L! x min(combo + 1, 6 x L)
// où L est le nombre de lignes et colonnes cassées du même coup, et combo le nombre de lots d'affilée qui ont cassé
// une ligne. Non couvert : le bonus quand la grille se vide entièrement.
//
// Bareme est une classe sans état : on n'en crée jamais, on appelle directement Bareme.calculerPoints(). Elle sert à
// ranger ensemble le calcul et ses constantes.
class Bareme {
    /**
     * calcule la factorielle d'un nombre => 4! = 1 x 2 x 3 x 4 = 24
     * :param nombre: le nombre de départ
     * :return: le produit de tous les entiers de 1 à nombre
     */
    static calculerFactorielle(nombre) {
        let resultat = 1;

        for (let facteur = 2; facteur <= nombre; facteur++) {
            resultat *= facteur;
        }
        return resultat;
    }

    /**
     * calcule les points rapportés par une suppression
     * :param nbLignes: nombre de lignes et de colonnes cassées du même coup
     * :param combo: nombre de lots d'affilée ayant déjà cassé une ligne
     * :return: le nombre de points à ajouter au score
     */
    static calculerPoints(nbLignes, combo) {
        const lignes = Math.min(nbLignes, Bareme.MAX_LIGNES_COMPTEES);
        const multiplicateur = Math.min(combo + 1, Bareme.PLAFOND_COMBO_PAR_LIGNE * lignes);

        return Bareme.POINTS_PAR_LIGNE * Bareme.calculerFactorielle(lignes) * multiplicateur;
    }
}

// les constantes sont posées après la classe et non dedans : la syntaxe "static X = ..." n'est pas comprise par tous
// les navigateurs (c'est elle qui avait cassé le jeu sous Firefox)
Bareme.POINTS_PAR_LIGNE = 30;
Bareme.PLAFOND_COMBO_PAR_LIGNE = 6;

// une pièce casse au plus 6 lignes d'un coup : 5 lignes plus 1 colonne avec une ligne5, ou 3 plus 3 avec un carré 3x3
// la borne évite que la factorielle s'emballe si une forme plus grosse était ajoutée un jour
Bareme.MAX_LIGNES_COMPTEES = 6;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tirage des pièces
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Tirage regroupe tout ce qui sert à choisir les pièces proposées au joueur. Comme Bareme, c'est une classe sans état :
// on appelle directement Tirage.tirerLot().
class Tirage {
    /**
     * construit le sac dans lequel on tire les formes
     * chaque forme y est déposée une fois, les grosses POIDS_GROSSE_FORME fois : tirer au hasard dans ce sac revient à
     * donner plus de chances aux grosses formes, sans avoir à calculer quoi que ce soit au moment du tirage
     * :param formes: liste des noms de formes autorisées
     * :return: une liste où les grosses formes apparaissent plusieurs fois
     */
    static construireSac(formes) {
        const sac = [];

        for (const forme of formes) {
            const exemplaires = Tirage.GROSSES_FORMES.includes(forme) ? Tirage.POIDS_GROSSE_FORME : 1;
            for (let exemplaire = 0; exemplaire < exemplaires; exemplaire++) {
                sac.push(forme);
            }
        }
        return sac;
    }

    /**
     * tire un élément au hasard dans une liste
     * :param liste: la liste dans laquelle piocher
     * :return: un de ses éléments
     */
    static tirerAuHasard(liste) {
        return liste[Math.floor(Math.random() * liste.length)];
    }

    /**
     * tire un lot de pièces au hasard, sans vérifier qu'elles sont posables
     * :param nombre: nombre de pièces à tirer
     * :param sac: sac de formes construit par construireSac
     * :param nbCouleurs: nombre de couleurs disponibles
     * :param chanceTriple: probabilité que les pièces partagent toutes la même forme
     * :return: une liste d'objets {id, forme, couleur}
     */
    static creerPieces(nombre, sac, nbCouleurs, chanceTriple) {
        // tirée une fois pour tout le lot : si elle n'est pas nulle, toutes les pièces prennent cette forme
        let formeCommune = null;
        if (Math.random() < chanceTriple) {
            formeCommune = Tirage.tirerAuHasard(sac);
        }

        const pieces = [];
        for (let rang = 0; rang < nombre; rang++) {
            pieces.push({
                id: `piece-${Tirage.prochainNumero}`,
                forme: formeCommune !== null ? formeCommune : Tirage.tirerAuHasard(sac),
                couleur: Math.floor(Math.random() * nbCouleurs),
            });
            Tirage.prochainNumero++;
        }
        return pieces;
    }

    /**
     * vérifie s'il existe un ordre et des emplacements permettant de poser TOUTES ces formes à la suite
     *
     * méthode, dite recherche avec retour en arrière : on choisit une forme, on l'essaie à chaque endroit possible, et
     * pour chaque endroit qui marche on recommence avec les formes restantes sur la grille obtenue. La fonction
     * s'appelle donc elle-même avec un problème plus petit, une forme de moins, jusqu'à la liste vide qui est le cas
     * gagnant. Si aucun essai ne mène à la liste vide, c'est perdu.
     *
     * exemple avec deux formes A et B : on essaie A partout, et pour chaque position de A qui tient on regarde si B
     * rentre quelque part sur la grille où A est déjà posée. Si aucune position de A ne laisse de place à B, on repart
     * de zéro en essayant B en premier. D'où "dans un ordre" dans le nom de la fonction.
     *
     * :param grille: la grille de départ, qui n'est pas modifiée
     * :param formes: liste des noms de formes à poser
     * :return: true s'il existe une solution, sinon false
     */
    static peutToutPoserDansUnOrdre(grille, formes) {
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

            for (let ligne = 0; ligne < grille.taille; ligne++) {
                for (let colonne = 0; colonne < grille.taille; colonne++) {
                    if (!grille.peutPoser(forme, ligne, colonne)) continue;

                    const grilleSuivante = grille.simulerPose(forme, ligne, colonne);
                    if (Tirage.peutToutPoserDansUnOrdre(grilleSuivante, restantes)) return true;
                }
            }
        }

        // aucune forme, à aucun endroit, ne mène à une solution
        return false;
    }

    /**
     * tire un lot de pièces posables toutes ensemble, dans un ordre ou dans un autre
     * une défaite vient donc d'un mauvais placement du joueur, jamais du tirage
     * en dernier recours on garde le dernier lot tiré, dont chaque pièce est au moins posable seule
     * :param grille: la grille sur laquelle les pièces devront rentrer
     * :param nombre: nombre de pièces à tirer
     * :param nbCouleurs: nombre de couleurs disponibles
     * :return: une liste d'objets {id, forme, couleur}
     */
    static tirerLot(grille, nombre, nbCouleurs) {
        // formes qui rentrent encore quelque part, calculées une seule fois puisque la grille ne change pas entre
        // deux essais
        const posables = [];
        for (const forme of Forme.listerNoms()) {
            if (grille.peutPoserQuelquePart(forme)) posables.push(forme);
        }

        const sac = Tirage.construireSac(posables.length > 0 ? posables : Forme.listerNoms());
        const chanceTriple = grille.estVide() ? Tirage.CHANCE_TRIPLE_GRILLE_VIDE : Tirage.CHANCE_TRIPLE_EN_JEU;

        let pieces;
        for (let essai = 0; essai < Tirage.MAX_ESSAIS_LOT; essai++) {
            pieces = Tirage.creerPieces(nombre, sac, nbCouleurs, chanceTriple);

            const formes = [];
            for (const piece of pieces) {
                formes.push(piece.forme);
            }
            if (Tirage.peutToutPoserDansUnOrdre(grille, formes)) return pieces;
        }
        return pieces;
    }
}

// un lot sur trois est composé de trois fois la même forme quand la grille est vide, contre 3 % en cours de partie
// c'est le comportement du jeu original
Tirage.CHANCE_TRIPLE_GRILLE_VIDE = 1 / 3;
Tirage.CHANCE_TRIPLE_EN_JEU = 0.03;

// les grosses formes sortent plus souvent, là aussi comme dans le jeu original
Tirage.GROSSES_FORMES = ["carre_3x3", "rect_2x3", "rect_3x2"];
Tirage.POIDS_GROSSE_FORME = 5;

// nombre d'essais avant d'abandonner la garantie d'un lot entièrement posable
Tirage.MAX_ESSAIS_LOT = 40;

// numérotation des pièces : chaque pièce a besoin d'un identifiant unique pour que l'affichage sache laquelle est
// glissée, et un simple compteur partagé par tout le jeu suffit
Tirage.prochainNumero = 1;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// état de la partie
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// la partie en cours : la grille, le score, le combo et les pièces proposées au joueur
class Partie {
    /**
     * prépare une nouvelle partie : grille vide, score à zéro et premier lot de pièces
     * :param taille: côté de la grille
     * :param nbCouleurs: nombre de couleurs de pièces disponibles
     */
    constructor(taille = 8, nbCouleurs = 4) {
        this.grille = new Grille(taille);
        this.nbCouleurs = nbCouleurs;
        this.score = 0;
        this.combo = 0;
        // passe à true dès qu'une ligne saute dans le lot en cours, et décide en fin de lot si le combo est conservé
        this.ligneCasseeDansLeLot = false;
        this.pieces = Tirage.tirerLot(this.grille, Partie.PIECES_PAR_LOT, nbCouleurs);
    }

    /**
     * cherche une pièce dans la réserve à partir de son identifiant
     * :param id: identifiant cherché
     * :return: la pièce, ou null si elle n'est pas dans la réserve
     */
    trouverPiece(id) {
        for (const piece of this.pieces) {
            if (piece.id === id) return piece;
        }
        return null;
    }

    /**
     * retire une pièce de la réserve
     * :param id: identifiant de la pièce à retirer
     * :return: rien, la réserve est modifiée
     */
    retirerPiece(id) {
        const reserve = [];

        for (const piece of this.pieces) {
            if (piece.id !== id) reserve.push(piece);
        }
        this.pieces = reserve;
    }

    /**
     * vide les lignes et colonnes pleines et ajoute les points correspondants
     * le combo monte ici mais ne redescend jamais : c'est poserPiece qui tranche en fin de lot
     * :return: rien, la partie est modifiée
     */
    supprimerLignesPleines() {
        const pleines = this.grille.chercherLignesPleines();
        const nbLignes = pleines.lignes.length + pleines.colonnes.length;

        // rien de plein : rien à faire
        if (nbLignes === 0) return;

        this.grille.viderLignes(pleines);
        this.score += Bareme.calculerPoints(nbLignes, this.combo);
        this.combo += 1;
        this.ligneCasseeDansLeLot = true;
    }

    /**
     * pose une pièce sur la grille et applique toutes les conséquences du coup
     * :param idPiece: identifiant de la pièce posée
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :return: true si la pièce a été posée, false si la pose était impossible (la partie ne change alors pas)
     */
    poserPiece(idPiece, ligne, colonne) {
        const piece = this.trouverPiece(idPiece);
        if (piece === null || !this.grille.peutPoser(piece.forme, ligne, colonne)) {
            return false;
        }

        // 1. la pièce est dessinée sur la grille, quitte la réserve et rapporte un point par case occupée
        //    on écrit couleur + 1 parce que 0 est réservé aux cases vides
        this.grille.poserForme(piece.forme, ligne, colonne, piece.couleur + 1);
        this.retirerPiece(idPiece);
        this.score += Forme.trouverParNom(piece.forme).nbCases;

        // 2. les lignes et colonnes devenues pleines sautent et rapportent leurs points
        this.supprimerLignesPleines();

        // 3. il reste des pièces dans la réserve : le lot n'est pas fini, on s'arrête là
        if (this.pieces.length > 0) return true;

        // 4. fin de lot : le combo ne retombe à 0 que si aucune des 3 pièces n'a cassé de ligne
        //    le lot suivant est tiré sur la grille telle qu'elle sera affichée au joueur
        if (!this.ligneCasseeDansLeLot) {
            this.combo = 0;
        }
        this.ligneCasseeDansLeLot = false;
        this.pieces = Tirage.tirerLot(this.grille, Partie.PIECES_PAR_LOT, this.nbCouleurs);
        return true;
    }

    /**
     * vérifie si la partie est terminée => aucune des pièces proposées ne rentre nulle part
     * :return: true si le joueur est bloqué, sinon false
     */
    estTerminee() {
        for (const piece of this.pieces) {
            if (this.grille.peutPoserQuelquePart(piece.forme)) return false;
        }
        return true;
    }

    /**
     * remplit une case vide ou vide une case pleine
     * sert au mode debug, pour préparer une situation à la main
     * :param ligne: ligne de la case
     * :param colonne: colonne de la case
     * :return: rien, la grille est modifiée
     */
    basculerCase(ligne, colonne) {
        this.grille.basculerCase(ligne, colonne);
    }
}

// nombre de pièces proposées au joueur en même temps
Partie.PIECES_PAR_LOT = 3;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// rend les classes accessibles aux tests exécutés avec Node
// dans le navigateur la variable "module" n'existe pas, la ligne est donc simplement ignorée
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (typeof module !== "undefined") {
    module.exports = { Forme, Grille, Bareme, Tirage, Partie };
}
