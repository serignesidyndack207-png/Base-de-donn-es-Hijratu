const MDP = 'Xidma2026';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXSV78vobc8uUaljGtrdYsXVzqPiJky4-6GEqK4jTcINLOVnOqoSpN_cFQI8Ivy4KM/exec';

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const saisi = document.getElementById('motdepasse').value;
    const erreur = document.getElementById('erreur-mdp');

    if (saisi === MDP) {
        erreur.style.display = 'none';
        document.getElementById('zone-login').style.display = 'none';
        const zoneAdmin = document.getElementById('zone-admin');
        zoneAdmin.style.display = 'flex';
        zoneAdmin.style.flexDirection = 'column';
        zoneAdmin.style.alignItems = 'center';
        chargerDepuisSheets();
    } else {
        erreur.style.display = 'block';
    }
});

// Charger les membres depuis Google Sheets
function chargerDepuisSheets() {
    const tbody = document.getElementById('tableau-membres');
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Chargement en cours...</td></tr>`;

    fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(membres => {
            afficherTableau(membres);
        })
        .catch(() => {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Erreur de chargement. Vérifiez votre connexion.</td></tr>`;
        });
}

// Formater une date ISO en DD/MM/YYYY
function formaterDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const jour = String(d.getUTCDate()).padStart(2, '0');
    const mois = String(d.getUTCMonth() + 1).padStart(2, '0');
    const annee = d.getUTCFullYear();
    return `${jour}/${mois}/${annee}`;
}

function afficherTableau(membres) {
    const tbody = document.getElementById('tableau-membres');
    const total = document.getElementById('total-membres');
    const derniere = document.getElementById('derniere-date');

    total.textContent = membres.length;
    derniere.textContent = membres.length > 0 ? formaterDate(membres[membres.length - 1].date) : '—';

    if (membres.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Aucun membre trouvé.</td></tr>`;
        return;
    }

    tbody.innerHTML = membres.map(m => `
        <tr>
            <td>${m.idcarte}</td>
            <td>${m.nomprenom}</td>
            <td>${m.telephone}</td>
            <td>${m.email}</td>
            <td>${formaterDate(m.date)}</td>
            <td>
                <button class="btn-supprimer" onclick="supprimerMembre('${m.idcarte}')">
                    🗑 Supprimer
                </button>
            </td>
        </tr>
    `).join('');

    window._membres = membres;
}

// Recherche
function rechercherMembres() {
    const terme = document.getElementById('recherche').value.toLowerCase().trim();
    const membres = window._membres || [];

    const resultats = membres.filter(m =>
        m.nomprenom.toLowerCase().includes(terme) ||
        m.idcarte.toString().toLowerCase().includes(terme) ||
        m.telephone.toLowerCase().includes(terme)
    );

    afficherTableau(resultats);
}

// ✅ Supprimer un membre réellement dans Google Sheets
function supprimerMembre(idcarte) {
    const confirmer = confirm(`Voulez-vous vraiment supprimer le membre avec la carte N° ${idcarte} ?`);
    if (!confirmer) return;

    document.querySelectorAll('.btn-supprimer').forEach(b => b.disabled = true);

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supprimer', idcarte: idcarte })
    })
    .then(() => {
        window._membres = window._membres.filter(m => String(m.idcarte) !== String(idcarte));
        afficherTableau(window._membres);
        alert(`✅ Membre N° ${idcarte} supprimé avec succès.`);
    })
    .catch(() => {
        alert('❌ Erreur lors de la suppression. Vérifiez votre connexion.');
        document.querySelectorAll('.btn-supprimer').forEach(b => b.disabled = false);
    });
}

// Export Excel
function exporterExcel() {
    const membres = window._membres || [];
    if (membres.length === 0) {
        alert('Aucun membre enregistré pour le moment.');
        return;
    }
    const donnees = membres.map(m => ({
        'N° Carte':       m.idcarte,
        'Nom et Prénoms': m.nomprenom,
        'Téléphone':      m.telephone,
        'Email':          m.email,
        'Date':           formaterDate(m.date)
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Membres');
    XLSX.writeFile(wb, 'membres_dahira.xlsx');
}

// Déconnexion
function seDeconnecter() {
    document.getElementById('zone-admin').style.display = 'none';
    document.getElementById('zone-login').style.display = 'block';
    document.getElementById('motdepasse').value = '';
    document.getElementById('erreur-mdp').style.display = 'none';
    document.getElementById('recherche').value = '';
    window._membres = [];
}
