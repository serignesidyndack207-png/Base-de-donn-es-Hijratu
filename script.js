const STORAGE_KEY = 'dahira_membres';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXSV78vobc8uUaljGtrdYsXVzqPiJky4-6GEqK4jTcINLOVnOqoSpN_cFQI8Ivy4KM/exec';

function chargerMembres() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}
function sauvegarderMembres(membres) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(membres));
}
function afficherConfirmation(nom) {
    const ancien = document.getElementById('msg-confirmation');
    if (ancien) ancien.remove();
    const overlay = document.createElement('div');
    overlay.id = 'msg-confirmation';
    overlay.className = 'overlay-confirmation';
    overlay.innerHTML = `
        <div class="modal-confirmation">
            <div class="modal-icon">✅</div>
            <h2>Enregistrement réussi !</h2>
            <p>Les données de <strong>${nom}</strong> ont été enregistrées avec succès.</p>
            <p class="modal-merci">Merci pour votre inscription.</p>
            <button onclick="fermerConfirmation()">Fermer</button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => fermerConfirmation(), 5000);
}
function afficherErreur() {
    const ancien = document.getElementById('msg-confirmation');
    if (ancien) ancien.remove();
    const overlay = document.createElement('div');
    overlay.id = 'msg-confirmation';
    overlay.className = 'overlay-confirmation';
    overlay.innerHTML = `
        <div class="modal-confirmation">
            <div class="modal-icon">❌</div>
            <h2>Erreur d'enregistrement</h2>
            <p>Une erreur est survenue. Vérifiez votre connexion et réessayez.</p>
            <button onclick="fermerConfirmation()">Fermer</button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => fermerConfirmation(), 5000);
}
function fermerConfirmation() {
    const msg = document.getElementById('msg-confirmation');
    if (msg) {
        msg.classList.add('fade-out');
        setTimeout(() => msg.remove(), 400);
    }
}

document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const membre = {
        idcarte:   document.getElementById('idcarte').value.trim(),
        nomprenom: document.getElementById('nomprenom').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        email:     document.getElementById('email').value.trim(),
        date:      new Date().toLocaleDateString('fr-FR')
    };

    // Désactiver le bouton pendant la vérification
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Vérification...';

    // ✅ Vérifier le doublon directement dans Google Sheets (source de vérité)
    fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(membresSheets => {
            // Synchroniser le localStorage avec les données réelles de Sheets
            sauvegarderMembres(membresSheets);

            const doublon = membresSheets.find(m => String(m.idcarte) === String(membre.idcarte));
            if (doublon) {
                alert(`⚠️ Le numéro de carte "${membre.idcarte}" existe déjà.`);
                btn.disabled = false;
                btn.textContent = 'Enregistrer';
                return;
            }

            // Pas de doublon → envoyer vers Google Sheets
            btn.textContent = 'Envoi en cours...';
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membre)
            })
            .then(() => {
                // Mettre à jour le localStorage avec le nouveau membre
                const membresLocaux = chargerMembres();
                membresLocaux.push(membre);
                sauvegarderMembres(membresLocaux);
                afficherConfirmation(membre.nomprenom);
                document.getElementById('memberForm').reset();
            })
            .catch(() => {
                afficherErreur();
            })
            .finally(() => {
                btn.disabled = false;
                btn.textContent = 'Enregistrer';
            });
        })
        .catch(() => {
            // Si impossible de joindre Sheets, fallback sur localStorage
            const membresLocaux = chargerMembres();
            const doublon = membresLocaux.find(m => String(m.idcarte) === String(membre.idcarte));
            if (doublon) {
                alert(`⚠️ Le numéro de carte "${membre.idcarte}" existe déjà.`);
                btn.disabled = false;
                btn.textContent = 'Enregistrer';
                return;
            }
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membre)
            })
            .then(() => {
                membresLocaux.push(membre);
                sauvegarderMembres(membresLocaux);
                afficherConfirmation(membre.nomprenom);
                document.getElementById('memberForm').reset();
            })
            .catch(() => afficherErreur())
            .finally(() => {
                btn.disabled = false;
                btn.textContent = 'Enregistrer';
            });
        });
});
