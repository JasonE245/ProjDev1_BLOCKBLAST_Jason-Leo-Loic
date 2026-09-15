// chaque thème donne les couleurs de l'interface, plus une liste de nuances pour les pièces posées
// la longueur de cette liste est la seule source de vérité pour le nombre de couleurs du jeu : ajouter une nuance ici
// suffit, le reste du programme suit tout seul
const themes = [
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
const NB_COULEURS_PIECES = themes[0].pieces.length;

function appliquerTheme(theme) {
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

function afficherChoixTheme(surChoix) {
    const panneau = document.getElementById("panneau-themes");

    for (const theme of themes) {
        const pastille = document.createElement("button");
        pastille.className = "pastille-theme";
        pastille.style.background = theme.pleine;
        pastille.title = theme.nom;
        pastille.addEventListener("click", () => surChoix(theme));
        panneau.appendChild(pastille);
    }

    document.getElementById("bouton-theme").addEventListener("click", () => {
        panneau.classList.toggle("ouvert");
    });
}

// taille d'une case en pixels, transmise au CSS par la variable --taille-case
const TAILLE_CASE = 40;

// dernier état affiché. Les écouteurs de la grille sont posés une seule fois alors que les cases sont recréées à
// chaque affichage : ils viennent lire l'état courant ici.
let etatAffiche = null;

// identifiant de la pièce en cours de glisser-déposer, ou null. C'est de l'affichage, pas de l'état du jeu.
let idPieceGlissee = null;

function caseGrille(ligne, colonne) {
    return document.querySelector(`#grille .case[data-ligne="${ligne}"][data-colonne="${colonne}"]`);
}

function casesDesLignes(taille, pleines) {
    const cases = new Set();

    for (const ligne of pleines.lignes) {
        for (let colonne = 0; colonne < taille; colonne++) {
            cases.add(caseGrille(ligne, colonne));
        }
    }
    for (const colonne of pleines.colonnes) {
        for (let ligne = 0; ligne < taille; ligne++) {
            cases.add(caseGrille(ligne, colonne));
        }
    }
    // caseGrille renvoie null pour des coordonnées hors grille, on retire cette valeur
    cases.delete(null);
    return cases;
}

function colorerCase(element, couleur) {
    element.style.setProperty("--remplissage-case", `var(--couleur-piece-${couleur})`);
}

function afficherGrille(etat) {
    // les écouteurs posés sur la grille viendront lire cet état
    etatAffiche = etat;

    const conteneur = document.getElementById("grille");
    conteneur.style.setProperty("--taille-case", `${TAILLE_CASE}px`);
    conteneur.style.gridTemplateColumns = `repeat(${etat.taille}, var(--taille-case))`;
    conteneur.style.gridTemplateRows = `repeat(${etat.taille}, var(--taille-case))`;

    // on repart d'une grille vide plutôt que de modifier les cases existantes
    conteneur.innerHTML = "";

    for (let ligne = 0; ligne < etat.taille; ligne++) {
        for (let colonne = 0; colonne < etat.taille; colonne++) {
            const element = document.createElement("div");
            element.className = "case";
            // les coordonnées sont stockées sur la case pour être relues au moment du clic ou du lâcher
            element.dataset.ligne = ligne;
            element.dataset.colonne = colonne;

            // 0 = case vide, 1 à 4 = couleur de la pièce posée, d'où le -1
            const valeur = etat.grille[ligne][colonne];
            if (valeur !== 0) colorerCase(element, valeur - 1);

            conteneur.appendChild(element);
        }
    }
}

function effacerApercu() {
    for (const element of document.querySelectorAll("#grille .case")) {
        element.classList.remove("apercu-valide", "apercu-invalide", "apercu-suppression");
    }
}

function afficherApercu(etat, forme, ligne, colonne) {
    effacerApercu();

    const valide = peutPoser(etat.grille, forme, ligne, colonne);

    for (const [l, c] of casesDeLaForme(forme, ligne, colonne)) {
        // une forme survolée près d'un bord déborde de la grille : caseGrille ne trouve alors aucune case, et il n'y
        // a rien à marquer pour cette partie de la forme
        const element = caseGrille(l, c);
        if (element !== null) {
            element.classList.add(valide ? "apercu-valide" : "apercu-invalide");
        }
    }

    // rien de plus à montrer si la pose est impossible
    if (!valide) return;

    // met en évidence les lignes et colonnes que cette pose ferait sauter
    const cassees = lignesCasseesPar(etat.grille, forme, ligne, colonne);
    for (const element of casesDesLignes(etat.taille, cassees)) {
        element.classList.add("apercu-suppression");
    }
}

function animerLignesCassees(etat, cassees) {
    for (const element of casesDesLignes(etat.taille, cassees)) {
        element.classList.add("vient-de-sauter");

        // la durée est celle définie dans le CSS : il n'y a donc pas de valeur à garder synchronisée des deux côtés
        element.addEventListener("animationend", () => {
            element.classList.remove("vient-de-sauter");
        }, { once: true });
    }
}

function origineDeLaPose(forme, element, evenement) {
    const taille = tailleDeLaForme(forme);

    // position du curseur en nombre de cases, virgule comprise
    const ligneCurseur = Number(element.dataset.ligne) + evenement.offsetY / TAILLE_CASE;
    const colonneCurseur = Number(element.dataset.colonne) + evenement.offsetX / TAILLE_CASE;

    // on recule d'une demi-forme pour que le curseur se retrouve au milieu
    return {
        ligne: Math.round(ligneCurseur - taille.lignes / 2),
        colonne: Math.round(colonneCurseur - taille.colonnes / 2),
    };
}

function initInteractionsGrille(surPose, surBascule) {
    const conteneur = document.getElementById("grille");

    conteneur.addEventListener("dragover", surSurvolGlisser);
    conteneur.addEventListener("drop", (evenement) => surLacher(evenement, surPose));
    conteneur.addEventListener("click", (evenement) => surClicDebug(evenement, surBascule));
}

function pieceGlisseeSur(evenement) {
    // closest remonte de l'élément touché jusqu'à la case qui le contient ; renvoie null pour la marge de la grille
    const element = evenement.target.closest(".case");
    if (element === null || etatAffiche === null) return null;

    const piece = trouverPiece(etatAffiche.pieces, idPieceGlissee);
    if (piece === null) return null;

    return { element: element, piece: piece };
}

function surSurvolGlisser(evenement) {
    const cible = pieceGlisseeSur(evenement);
    if (cible === null) return;

    // sans preventDefault, le navigateur refuse le lâcher sur cette case
    evenement.preventDefault();
    evenement.dataTransfer.dropEffect = "move";

    const origine = origineDeLaPose(cible.piece.forme, cible.element, evenement);
    afficherApercu(etatAffiche, cible.piece.forme, origine.ligne, origine.colonne);
}

function surLacher(evenement, surPose) {
    const cible = pieceGlisseeSur(evenement);
    if (cible === null) return;

    evenement.preventDefault();
    effacerApercu();

    const origine = origineDeLaPose(cible.piece.forme, cible.element, evenement);
    surPose(cible.piece.id, origine.ligne, origine.colonne);
}

function surClicDebug(evenement, surBascule) {
    if (!document.body.classList.contains("mode-debug")) return;

    const element = evenement.target.closest(".case");
    if (element === null) return;

    surBascule(Number(element.dataset.ligne), Number(element.dataset.colonne));
}

// mot à taper n'importe où sur la page pour activer ou désactiver le mode debug
const CODE_DEBUG = "debug";

function initRaccourciDebug() {
    let touchesTapees = "";

    document.addEventListener("keydown", (evenement) => {
        // on ignore les touches spéciales (Entrée, Majuscule, etc.) et les raccourcis avec Ctrl, Alt ou Commande
        if (evenement.key.length !== 1) return;
        if (evenement.ctrlKey || evenement.altKey || evenement.metaKey) return;

        // on ne garde que les dernières lettres tapées, autant qu'il y en a dans CODE_DEBUG
        touchesTapees = (touchesTapees + evenement.key.toLowerCase()).slice(-CODE_DEBUG.length);

        if (touchesTapees === CODE_DEBUG) {
            document.body.classList.toggle("mode-debug");
        }
    });
}

function creerElementPiece(piece) {
    const taille = tailleDeLaForme(piece.forme);
    const cases = FORMES[piece.forme];

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
            for (const [l, c] of cases) {
                if (l === ligne && c === colonne) occupee = true;
            }
            if (occupee) colorerCase(petiteCase, piece.couleur);

            element.appendChild(petiteCase);
        }
    }

    element.addEventListener("dragstart", (evenement) => {
        idPieceGlissee = piece.id;

        // Firefox refuse de démarrer un glisser si aucune donnée n'est associée à l'événement
        evenement.dataTransfer.setData("text/plain", piece.id);
        evenement.dataTransfer.effectAllowed = "move";

        // l'image qui suit le curseur est accrochée par son milieu et non par son coin
        const rectangle = element.getBoundingClientRect();
        evenement.dataTransfer.setDragImage(element, rectangle.width / 2, rectangle.height / 2);

        element.classList.add("en-glissement");
    });

    element.addEventListener("dragend", () => {
        idPieceGlissee = null;
        element.classList.remove("en-glissement");
        effacerApercu();
    });

    return element;
}

function afficherReserve(etat) {
    const conteneur = document.getElementById("reserve");
    conteneur.innerHTML = "";

    for (const piece of etat.pieces) {
        // chaque pièce est centrée dans un emplacement de taille fixe, pour que la réserve ne saute pas d'un lot
        // à l'autre selon la taille des formes
        const emplacement = document.createElement("div");
        emplacement.className = "emplacement-piece";
        emplacement.appendChild(creerElementPiece(piece));

        conteneur.appendChild(emplacement);
    }
}

function afficherScore(etat, record) {
    document.getElementById("score").textContent = `Score : ${etat.score}`;
    document.getElementById("record").textContent = `Record : ${record}`;

    // le combo n'est affiché qu'à partir de 2 suppressions d'affilée, quand il rapporte vraiment
    const elementCombo = document.getElementById("combo");
    elementCombo.textContent = `Combo x${etat.combo}`;
    elementCombo.classList.toggle("visible", etat.combo > 1);
}

function afficherFinDePartie(etat) {
    const perdu = partieTerminee(etat);
    document.getElementById("fin-de-partie").classList.toggle("ouvert", perdu);

    if (perdu) {
        document.getElementById("score-final").textContent = etat.score;
    }
}
