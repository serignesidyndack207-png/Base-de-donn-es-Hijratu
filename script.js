const STORAGE_KEY = 'dahira_membres';

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

    const membres = chargerMembres();

    const doublon = membres.find(m => m.idcarte === membre.idcarte);
    if (doublon) {
        alert(`⚠️ Le numéro de carte "${membre.idcarte}" existe déjà.`);
        return;
    }

    membres.push(membre);
    sauvegarderMembres(membres);
    afficherConfirmation(membre.nomprenom);
    this.reset();
});