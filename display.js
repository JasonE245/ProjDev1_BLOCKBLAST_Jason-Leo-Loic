// programme: Block Blast section affichage
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 18.08.2026
// Version: V.3.0
// dernière modif: 08.10.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ce fichier contient tout ce qui touche à la page. Ses classes lisent la partie mais ne la modifient jamais : quand
// le joueur fait quelque chose, elles préviennent le jeu (la classe Jeu de main.js) en appelant la fonction qu'il
// leur a donnée.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// thèmes de couleurs
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Themes est une classe sans état, comme Bareme : elle range la liste des thèmes et ce qui sert à les appliquer
class Themes {
    /**
     * applique un thème à toute la page
     * les couleurs sont posées comme variables CSS : le reste de la mise en forme y fait référence sans les connaître
     * :param theme: un des objets de Themes.LISTE
     * :return: rien, la page change de couleurs
     */
    static appliquer(theme) {
        const racine = document.documentElement.style;

        racine.setProperty("--couleur-fond", theme.fond);
        racine.setProperty("--fond-grille", theme.grille);
        racine.setProperty("--couleur-case", theme.case);
        racine.setProperty("--couleur-pleine", theme.pleine);

        // une variable par nuance de pièce => --couleur-piece-0, --couleur-piece-1, etc.
        for (let index = 0; index < theme.pieces.length; index++) {
            racine.setProperty(`--couleur-piece-${index}`, theme.pieces[index]);
        }
    }

    /**
     * retrouve un thème à partir de son nom
     * :param nom: nom du thème cherché, ou null au tout premier lancement
     * :return: le thème qui porte ce nom, ou le premier de la liste si aucun ne correspond
     */
    static trouverParNom(nom) {
        for (const theme of Themes.LISTE) {
            if (theme.nom === nom) return theme;
        }
        return Themes.LISTE[0];
    }

    /**
     * remplit le panneau de choix de thème et branche le bouton qui l'ouvre
     * :param gererChoix: fonction appelée avec le thème choisi quand le joueur clique une pastille
     * :return: rien, le panneau est rempli
     */
    static afficherChoix(gererChoix) {
        const panneau = document.getElementById("panneau-themes");

        for (const theme of Themes.LISTE) {
            const pastille = document.createElement("button");
            pastille.className = "pastille-theme";
            pastille.style.background = theme.pleine;
            pastille.title = theme.nom;
            pastille.addEventListener("click", () => gererChoix(theme));
            panneau.appendChild(pastille);
        }

        document.getElementById("bouton-theme").addEventListener("click", () => {
            panneau.classList.toggle("ouvert");
        });
    }
}

// chaque thème donne les couleurs de l'interface, plus une liste de nuances pour les pièces posées
// la longueur de cette liste est la seule source de vérité pour le nombre de couleurs du jeu : ajouter une nuance ici
// suffit, le reste du programme suit tout seul
Themes.LISTE = [
    {
        nom: "mauve", fond: "#1e1e2e", grille: "#313244", case: "#45475a", pleine: "#89b4fa",
        pieces: ["#89b4fa", "#74c7ec", "#94e2d5", "#b4befe"],
    },
    {
        nom: "rose", fond: "#2a1e2e", grille: "#3d2a3f", case: "#5a4550", pleine: "#f5a1c9",
        pieces: ["#f5a1c9", "#f2a9e0", "#eba0e0", "#f5c2e7"],
    },
    {
        nom: "forêt", fond: "#1a2418", grille: "#2b3a28", case: "#40523c", pleine: "#8fd97f",
        pieces: ["#8fd97f", "#a6e3a1", "#94e2a1", "#b8e994"],
    },
    {
        nom: "ambre", fond: "#2a2016", grille: "#3f3122", case: "#5c4a32", pleine: "#f5b942",
        pieces: ["#f5b942", "#f9c74f", "#f8961e", "#f3a83c"],
    },
];

// nombre de couleurs de pièces, déduit du premier thème
Themes.NB_COULEURS = Themes.LISTE[0].pieces.length;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// grille
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// l'affichage de la grille : les cases, l'aperçu pendant le glisser-déposer et l'animation des lignes qui sautent
class VueGrille {
    constructor() {
        this.conteneur = document.getElementById("grille");
        this.conteneur.style.setProperty("--taille-case", `${VueGrille.TAILLE_CASE}px`);

        // dernière partie dessinée. Le glisser-déposer vient la lire pour savoir quelle pièce est glissée, et
        // l'aperçu pour savoir où elle rentre.
        this.partieAffichee = null;
    }

    /**
     * colore une case avec une des nuances du thème
     * on passe par la variable --remplissage-case et non par une classe : le CSS n'a ainsi pas besoin de connaître le
     * nombre de couleurs, et les classes d'aperçu restent prioritaires sur la couleur de la pièce
     * la méthode est statique parce qu'elle sert aussi aux petites cases des pièces de la réserve
     * :param element: l'élément de la case
     * :param couleur: index de la nuance, de 0 à Themes.NB_COULEURS - 1
     * :return: rien, la case change de couleur
     */
    static colorerCase(element, couleur) {
        element.style.setProperty("--remplissage-case", `var(--couleur-piece-${couleur})`);
    }

    /**
     * retrouve l'élément d'une case de la grille à partir de ses coordonnées
     * :param ligne: ligne cherchée
     * :param colonne: colonne cherchée
     * :return: l'élément de la page, ou null si ces coordonnées sortent de la grille
     */
    trouverCase(ligne, colonne) {
        return this.conteneur.querySelector(`.case[data-ligne="${ligne}"][data-colonne="${colonne}"]`);
    }

    /**
     * rassemble les éléments de toutes les cases des lignes et colonnes indiquées
     * on utilise un Set et non une liste, sinon une case au croisement d'une ligne pleine et d'une colonne pleine
     * serait comptée deux fois
     * :param pleines: objet {lignes, colonnes} contenant les index concernés
     * :return: un Set d'éléments de la page
     */
    listerCasesDesLignes(pleines) {
        const taille = this.partieAffichee.grille.taille;
        const cases = new Set();

        for (const ligne of pleines.lignes) {
            for (let colonne = 0; colonne < taille; colonne++) {
                cases.add(this.trouverCase(ligne, colonne));
            }
        }
        for (const colonne of pleines.colonnes) {
            for (let ligne = 0; ligne < taille; ligne++) {
                cases.add(this.trouverCase(ligne, colonne));
            }
        }
        // trouverCase renvoie null pour des coordonnées hors grille, on retire cette valeur
        cases.delete(null);
        return cases;
    }

    /**
     * redessine entièrement la grille à partir de la partie
     * :param partie: la partie en cours
     * :return: rien, la grille est reconstruite
     */
    afficher(partie) {
        this.partieAffichee = partie;
        const taille = partie.grille.taille;

        this.conteneur.style.gridTemplateColumns = `repeat(${taille}, var(--taille-case))`;
        this.conteneur.style.gridTemplateRows = `repeat(${taille}, var(--taille-case))`;

        // on repart d'une grille vide plutôt que de modifier les cases existantes
        this.conteneur.innerHTML = "";

        for (let ligne = 0; ligne < taille; ligne++) {
            for (let colonne = 0; colonne < taille; colonne++) {
                const element = document.createElement("div");
                element.className = "case";
                // les coordonnées sont stockées sur la case pour être relues au moment du clic ou du lâcher
                element.dataset.ligne = ligne;
                element.dataset.colonne = colonne;

                // 0 = case vide, 1 à 4 = couleur de la pièce posée, d'où le -1
                const valeur = partie.grille.lireCase(ligne, colonne);
                if (valeur !== 0) VueGrille.colorerCase(element, valeur - 1);

                this.conteneur.appendChild(element);
            }
        }
    }

    /**
     * enlève toutes les marques d'aperçu de la grille
     * :return: rien, la grille reprend son apparence normale
     */
    effacerApercu() {
        for (const element of this.conteneur.querySelectorAll(".case")) {
            element.classList.remove("apercu-valide", "apercu-invalide", "apercu-suppression");
        }
    }

    /**
     * montre où la pièce se poserait, et ce que cette pose casserait
     * :param forme: nom de la forme survolée
     * :param ligne: ligne du coin haut-gauche envisagé
     * :param colonne: colonne du coin haut-gauche envisagé
     * :return: rien, la grille est marquée
     */
    afficherApercu(forme, ligne, colonne) {
        this.effacerApercu();

        const grille = this.partieAffichee.grille;
        const valide = grille.peutPoser(forme, ligne, colonne);

        for (const [l, c] of Forme.trouverParNom(forme).calculerCasesPosees(ligne, colonne)) {
            // une forme survolée près d'un bord déborde de la grille : trouverCase ne trouve alors aucune case, et il
            // n'y a rien à marquer pour cette partie de la forme
            const element = this.trouverCase(l, c);
            if (element !== null) {
                element.classList.add(valide ? "apercu-valide" : "apercu-invalide");
            }
        }

        // rien de plus à montrer si la pose est impossible
        if (!valide) return;

        // met en évidence les lignes et colonnes que cette pose ferait sauter
        const cassees = grille.chercherLignesCasseesPar(forme, ligne, colonne);
        for (const element of this.listerCasesDesLignes(cassees)) {
            element.classList.add("apercu-suppression");
        }
    }

    /**
     * fait clignoter les lignes qui viennent de sauter
     * elles sont calculées AVANT la pose par main.js : après, elles sont déjà vides et il n'y aurait plus rien à animer
     * :param cassees: objet {lignes, colonnes} calculé avant la pose
     * :return: rien, l'animation se lance
     */
    animerLignesCassees(cassees) {
        for (const element of this.listerCasesDesLignes(cassees)) {
            element.classList.add("vient-de-sauter");

            // la durée est celle définie dans le CSS : il n'y a donc pas de valeur à garder synchronisée des deux côtés
            element.addEventListener("animationend", () => {
                element.classList.remove("vient-de-sauter");
            }, { once: true });
        }
    }
}

// taille d'une case en pixels, transmise au CSS par la variable --taille-case
VueGrille.TAILLE_CASE = 40;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// glisser-déposer
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// le glisser-déposer d'une pièce de la réserve vers la grille
// les écouteurs sont posés sur la grille elle-même et non sur chacune des 64 cases : deux écouteurs au lieu de cent
// vingt-huit, et surtout rien à rebrancher après un affichage, puisque la grille survit alors que les cases sont
// recréées à chaque tour
class GlisserDeposer {
    /**
     * branche les écouteurs sur la grille
     * :param vueGrille: la VueGrille, qui connaît la partie affichée et sait dessiner l'aperçu
     * :param gererPose: fonction appelée avec (idPiece, ligne, colonne) quand le joueur lâche une pièce
     */
    constructor(vueGrille, gererPose) {
        this.vueGrille = vueGrille;
        this.gererPose = gererPose;
        // identifiant de la pièce en cours de glisser-déposer, ou null. C'est de l'affichage, pas de l'état du jeu.
        this.idPieceGlissee = null;

        // les fonctions fléchées gardent "this" : sans elles, this désignerait la grille et non le glisser-déposer
        vueGrille.conteneur.addEventListener("dragover", (evenement) => this.gererSurvol(evenement));
        vueGrille.conteneur.addEventListener("drop", (evenement) => this.gererLacher(evenement));
    }

    /**
     * appelée par la réserve quand le joueur attrape une pièce
     * :param idPiece: identifiant de la pièce attrapée
     * :return: rien
     */
    commencerGlisser(idPiece) {
        this.idPieceGlissee = idPiece;
    }

    /**
     * appelée par la réserve quand le joueur relâche la pièce, sur la grille ou ailleurs
     * :return: rien
     */
    terminerGlisser() {
        this.idPieceGlissee = null;
        this.vueGrille.effacerApercu();
    }

    /**
     * traduit la position du curseur en coin haut-gauche de la forme
     * sans ce calcul la pièce s'accrocherait par son coin, alors qu'on veut qu'elle paraisse centrée sous le curseur
     * :param forme: nom de la forme glissée
     * :param element: la case survolée
     * :param evenement: l'événement de souris, pour la position exacte dans la case
     * :return: un objet {ligne, colonne}, éventuellement hors de la grille
     */
    calculerOrigine(forme, element, evenement) {
        const taille = Forme.trouverParNom(forme).calculerTaille();

        // position du curseur en nombre de cases, virgule comprise
        const ligneCurseur = Number(element.dataset.ligne) + evenement.offsetY / VueGrille.TAILLE_CASE;
        const colonneCurseur = Number(element.dataset.colonne) + evenement.offsetX / VueGrille.TAILLE_CASE;

        // on recule d'une demi-forme pour que le curseur se retrouve au milieu
        return {
            ligne: Math.round(ligneCurseur - taille.lignes / 2),
            colonne: Math.round(colonneCurseur - taille.colonnes / 2),
        };
    }

    /**
     * retrouve la case survolée et la pièce en cours de glisser
     * :param evenement: l'événement de souris
     * :return: un objet {element, piece}, ou null si l'événement ne concerne pas une case ou si rien n'est glissé
     */
    trouverCible(evenement) {
        // closest remonte de l'élément touché jusqu'à la case qui le contient ; renvoie null pour la marge de la grille
        const partie = this.vueGrille.partieAffichee;
        const element = evenement.target.closest(".case");
        if (element === null || partie === null) return null;

        const piece = partie.trouverPiece(this.idPieceGlissee);
        if (piece === null) return null;

        return { element: element, piece: piece };
    }

    /**
     * montre l'aperçu pendant que le joueur promène une pièce au-dessus de la grille
     * :param evenement: l'événement dragover
     * :return: rien
     */
    gererSurvol(evenement) {
        const cible = this.trouverCible(evenement);
        if (cible === null) return;

        // sans preventDefault, le navigateur refuse le lâcher sur cette case
        evenement.preventDefault();
        evenement.dataTransfer.dropEffect = "move";

        const origine = this.calculerOrigine(cible.piece.forme, cible.element, evenement);
        this.vueGrille.afficherApercu(cible.piece.forme, origine.ligne, origine.colonne);
    }

    /**
     * prévient le programme principal quand le joueur lâche une pièce sur la grille
     * :param evenement: l'événement drop
     * :return: rien
     */
    gererLacher(evenement) {
        const cible = this.trouverCible(evenement);
        if (cible === null) return;

        evenement.preventDefault();
        this.vueGrille.effacerApercu();

        const origine = this.calculerOrigine(cible.piece.forme, cible.element, evenement);
        this.gererPose(cible.piece.id, origine.ligne, origine.colonne);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// mode debug
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// le mode debug : taper "debug" n'importe où sur la page l'active ou le désactive, et tant qu'il est actif, cliquer une
// case de la grille la remplit ou la vide. Sert à préparer une situation précise pour la tester.
class ModeDebug {
    /**
     * branche le clavier et le clic sur la grille
     * :param gererBascule: fonction appelée avec (ligne, colonne) quand le joueur clique une case en mode debug
     */
    constructor(gererBascule) {
        this.gererBascule = gererBascule;
        // dernières lettres tapées, autant qu'il y en a dans le mot à taper
        this.touchesTapees = "";

        // les fonctions fléchées gardent "this" : sans elles, this désignerait la page ou la grille, et non le mode
        // debug, au moment où l'événement arrive
        document.addEventListener("keydown", (evenement) => this.gererTouche(evenement));
        document.getElementById("grille").addEventListener("click", (evenement) => this.gererClic(evenement));
    }

    /**
     * :return: true si le mode debug est activé, sinon false
     */
    estActif() {
        return document.body.classList.contains("mode-debug");
    }

    /**
     * retient la touche tapée, et active ou désactive le mode debug quand le mot complet a été tapé
     * :param evenement: l'événement keydown
     * :return: rien
     */
    gererTouche(evenement) {
        // on ignore les touches spéciales (Entrée, Majuscule, etc.) et les raccourcis avec Ctrl, Alt ou Commande
        if (evenement.key.length !== 1) return;
        if (evenement.ctrlKey || evenement.altKey || evenement.metaKey) return;

        // on ne garde que les dernières lettres tapées, autant qu'il y en a dans ModeDebug.CODE
        this.touchesTapees = (this.touchesTapees + evenement.key.toLowerCase()).slice(-ModeDebug.CODE.length);

        if (this.touchesTapees === ModeDebug.CODE) {
            document.body.classList.toggle("mode-debug");
        }
    }

    /**
     * prévient le programme principal quand le joueur clique une case, en mode debug uniquement
     * :param evenement: l'événement click
     * :return: rien
     */
    gererClic(evenement) {
        if (!this.estActif()) return;

        const element = evenement.target.closest(".case");
        if (element === null) return;

        this.gererBascule(Number(element.dataset.ligne), Number(element.dataset.colonne));
    }
}

// mot à taper n'importe où sur la page pour activer ou désactiver le mode debug
ModeDebug.CODE = "debug";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// réserve de pièces
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// l'affichage des pièces proposées au joueur, chacune prête à être glissée sur la grille
class VueReserve {
    /**
     * :param glisserDeposer: le GlisserDeposer à prévenir quand le joueur attrape ou relâche une pièce
     */
    constructor(glisserDeposer) {
        this.conteneur = document.getElementById("reserve");
        this.glisserDeposer = glisserDeposer;
    }

    /**
     * redessine la réserve des pièces proposées
     * :param partie: la partie en cours
     * :return: rien, la réserve est reconstruite
     */
    afficher(partie) {
        this.conteneur.innerHTML = "";

        for (const piece of partie.pieces) {
            // chaque pièce est centrée dans un emplacement de taille fixe, pour que la réserve ne saute pas d'un lot
            // à l'autre selon la taille des formes
            const emplacement = document.createElement("div");
            emplacement.className = "emplacement-piece";
            emplacement.appendChild(this.creerElementPiece(piece));

            this.conteneur.appendChild(emplacement);
        }
    }

    /**
     * fabrique l'élément d'une pièce de la réserve, prêt à être glissé
     * :param piece: un objet {id, forme, couleur}
     * :return: l'élément de la page
     */
    creerElementPiece(piece) {
        const forme = Forme.trouverParNom(piece.forme);
        const taille = forme.calculerTaille();

        const element = document.createElement("div");
        element.className = "piece";
        element.draggable = true;
        element.style.gridTemplateColumns = `repeat(${taille.colonnes}, var(--taille-case-piece))`;
        element.style.gridTemplateRows = `repeat(${taille.lignes}, var(--taille-case-piece))`;

        // on dessine tout le rectangle qui contient la forme, case par case
        for (let ligne = 0; ligne < taille.lignes; ligne++) {
            for (let colonne = 0; colonne < taille.colonnes; colonne++) {
                const petiteCase = document.createElement("div");
                petiteCase.className = "case-piece";

                // la forme ne remplit pas forcément tout son rectangle : on cherche si cette position en fait partie,
                // et sinon la case reste transparente
                let occupee = false;
                for (const [l, c] of forme.cases) {
                    if (l === ligne && c === colonne) occupee = true;
                }
                if (occupee) VueGrille.colorerCase(petiteCase, piece.couleur);

                element.appendChild(petiteCase);
            }
        }

        element.addEventListener("dragstart", (evenement) => {
            this.glisserDeposer.commencerGlisser(piece.id);

            // Firefox refuse de démarrer un glisser si aucune donnée n'est associée à l'événement
            evenement.dataTransfer.setData("text/plain", piece.id);
            evenement.dataTransfer.effectAllowed = "move";

            // l'image qui suit le curseur est accrochée par son milieu et non par son coin
            const rectangle = element.getBoundingClientRect();
            evenement.dataTransfer.setDragImage(element, rectangle.width / 2, rectangle.height / 2);

            element.classList.add("en-glissement");
        });

        element.addEventListener("dragend", () => {
            element.classList.remove("en-glissement");
            this.glisserDeposer.terminerGlisser();
        });

        return element;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// score et fin de partie
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// l'affichage du score, du record et du combo, et l'écran de fin de partie avec son bouton "Rejouer"
class VueScore {
    /**
     * retrouve les éléments de la page et branche le bouton "Rejouer"
     * les éléments sont cherchés une seule fois : ils restent les mêmes pendant tout le jeu
     * :param gererRejouer: fonction appelée quand le joueur clique sur "Rejouer"
     */
    constructor(gererRejouer) {
        this.elementScore = document.getElementById("score");
        this.elementRecord = document.getElementById("record");
        this.elementCombo = document.getElementById("combo");
        this.ecranFin = document.getElementById("fin-de-partie");
        this.elementScoreFinal = document.getElementById("score-final");

        document.getElementById("bouton-rejouer").addEventListener("click", gererRejouer);
    }

    /**
     * met à jour le score, le record et le combo
     * :param partie: la partie en cours
     * :param record: meilleur score connu, relu depuis le navigateur
     * :return: rien, les textes sont mis à jour
     */
    afficher(partie, record) {
        this.elementScore.textContent = `Score : ${partie.score}`;
        this.elementRecord.textContent = `Record : ${record}`;

        // le combo n'est affiché qu'à partir de 2 suppressions d'affilée, quand il rapporte vraiment
        this.elementCombo.textContent = `Combo x${partie.combo}`;
        this.elementCombo.classList.toggle("visible", partie.combo > 1);
    }

    /**
     * affiche ou cache l'écran de fin de partie
     * :param partie: la partie en cours
     * :return: rien
     */
    afficherFinDePartie(partie) {
        const perdu = partie.estTerminee();
        this.ecranFin.classList.toggle("ouvert", perdu);

        if (perdu) {
            this.elementScoreFinal.textContent = partie.score;
        }
    }
}
