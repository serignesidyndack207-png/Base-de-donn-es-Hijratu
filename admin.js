const MDP = 'Xidma2026@';
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

function chargerDepuisSheets() {
    const tbody = document.getElementById('tableau-membres');
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Chargement en cours...</td></tr>`;

    fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(membres => {
            window._membres = membres;
            afficherTableau(membres);
            // Brancher le bouton et la touche Entrée une fois connecté
            document.getElementById('btn-rechercher').addEventListener('click', filtrer);
            document.getElementById('recherche').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') filtrer();
            });
        })
        .catch(() => {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Erreur de chargement. Vérifiez votre connexion.</td></tr>`;
        });
}

function filtrer() {
    const terme = document.getElementById('recherche').value.toLowerCase().trim();
    const lignes = document.querySelectorAll('#tableau-membres tr[id^="ligne-"]');
    lignes.forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(terme) ? '' : 'none';
    });
}

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
    document.getElementById('total-membres').textContent = membres.length;
    document.getElementById('derniere-date').textContent =
        membres.length > 0 ? formaterDate(membres[membres.length - 1].date) : '—';

    if (membres.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Aucun membre trouvé.</td></tr>`;
        return;
    }

    tbody.innerHTML = membres.map(m => `
        <tr id="ligne-${m.idcarte}">
            <td>${m.idcarte}</td>
            <td>${m.nomprenom}</td>
            <td>${m.telephone}</td>
            <td>${m.email}</td>
            <td>${formaterDate(m.date)}</td>
            <td>
                <button class="btn-supprimer" onclick="supprimerMembre('${m.idcarte}', this)">
                    🗑 Supprimer
                </button>
            </td>
        </tr>
    `).join('');
}

function supprimerMembre(idcarte, btn) {
    const confirmer = confirm(`Voulez-vous vraiment supprimer le membre avec la carte N° ${idcarte} ?`);
    if (!confirmer) return;

    btn.disabled = true;
    btn.textContent = '⏳ Suppression...';

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'supprimer', idcarte: String(idcarte) })
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === 'supprime' || result.status === 'introuvable') {
            window._membres = window._membres.filter(m => String(m.idcarte) !== String(idcarte));
            const ligne = document.getElementById(`ligne-${idcarte}`);
            if (ligne) ligne.remove();
            document.getElementById('total-membres').textContent = window._membres.length;
            alert(`✅ Membre N° ${idcarte} supprimé avec succès.`);
        } else {
            alert('❌ Erreur inattendue lors de la suppression.');
            btn.disabled = false;
            btn.textContent = '🗑 Supprimer';
        }
    })
    .catch(() => {
        alert('❌ Erreur réseau. Vérifiez votre connexion.');
        btn.disabled = false;
        btn.textContent = '🗑 Supprimer';
    });
}

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

function seDeconnecter() {
    document.getElementById('zone-admin').style.display = 'none';
    document.getElementById('zone-login').style.display = 'block';
    document.getElementById('motdepasse').value = '';
    document.getElementById('erreur-mdp').style.display = 'none';
    document.getElementById('recherche').value = '';
    window._membres = [];
}
