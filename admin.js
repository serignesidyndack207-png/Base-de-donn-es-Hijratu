const MDP = 'Xidma2026';
const STORAGE_KEY = 'dahira_membres';

function chargerMembres() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function sauvegarderMembres(membres) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(membres));
}

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
        afficherTableau(chargerMembres());
    } else {
        erreur.style.display = 'block';
    }
});

function afficherTableau(membres) {
    const tbody = document.getElementById('tableau-membres');
    const total = document.getElementById('total-membres');
    const derniere = document.getElementById('derniere-date');
    const tous = chargerMembres();

    total.textContent = tous.length;
    derniere.textContent = tous.length > 0 ? tous[tous.length - 1].date : '—';

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
            <td>${m.date}</td>
            <td>
                <button class="btn-supprimer" onclick="supprimerMembre('${m.idcarte}')">
                    🗑 Supprimer
                </button>
            </td>
        </tr>
    `).join('');
}

function rechercherMembres() {
    const terme = document.getElementById('recherche').value.toLowerCase().trim();
    const membres = chargerMembres();

    const resultats = membres.filter(m =>
        m.nomprenom.toLowerCase().includes(terme) ||
        m.idcarte.toLowerCase().includes(terme) ||
        m.telephone.toLowerCase().includes(terme)
    );

    afficherTableau(resultats);
}

function supprimerMembre(idcarte) {
    const confirmer = confirm(`Voulez-vous vraiment supprimer le membre avec la carte N° ${idcarte} ?`);
    if (!confirmer) return;

    let membres = chargerMembres();
    membres = membres.filter(m => m.idcarte !== idcarte);
    sauvegarderMembres(membres);

    const terme = document.getElementById('recherche').value.trim();
    if (terme) {
        rechercherMembres();
    } else {
        afficherTableau(membres);
    }
}

function exporterExcel() {
    const membres = chargerMembres();
    if (membres.length === 0) {
        alert('Aucun membre enregistré pour le moment.');
        return;
    }
    const donnees = membres.map(m => ({
        'N° Carte':       m.idcarte,
        'Nom et Prénoms': m.nomprenom,
        'Téléphone':      m.telephone,
        'Email':          m.email,
        'Date':           m.date
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
}