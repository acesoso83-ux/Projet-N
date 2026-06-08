/* ============================================================
   ARTISAN PRO — Application principale
   Toutes les données sont sauvegardées dans localStorage
   (le navigateur se souvient de tout même après fermeture)
   ============================================================ */

// ===== DONNÉES (chargées depuis le navigateur) =====
let data = {
  clients:   JSON.parse(localStorage.getItem('ap_clients')   || '[]'),
  devis:     JSON.parse(localStorage.getItem('ap_devis')     || '[]'),
  chantiers: JSON.parse(localStorage.getItem('ap_chantiers') || '[]'),
  materiaux: JSON.parse(localStorage.getItem('ap_materiaux') || '[]'),
};

// Sauvegarde automatique dans le navigateur
function save(key) {
  localStorage.setItem('ap_' + key, JSON.stringify(data[key]));
}

// Génère un identifiant unique pour chaque entrée
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    goTo(link.dataset.module);
  });
});

function goTo(module) {
  // Désactiver tous les liens et modules
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  // Activer le bon lien et module
  document.querySelector(`[data-module="${module}"]`).classList.add('active');
  document.getElementById('module-' + module).classList.add('active');
  // Rafraîchir le contenu affiché
  refresh(module);
}

function refresh(module) {
  if (module === 'dashboard') renderDashboard();
  if (module === 'clients')   renderClients();
  if (module === 'devis')     renderDevis();
  if (module === 'chantiers') renderChantiers();
  if (module === 'materiaux') renderMateriaux();
}

// ===== TOAST (petite notification en bas à droite) =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Fermer en cliquant sur le fond
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== TABLEAU DE BORD =====
function renderDashboard() {
  document.getElementById('stat-clients').textContent   = data.clients.length;
  document.getElementById('stat-devis').textContent     = data.devis.length;
  document.getElementById('stat-chantiers').textContent = data.chantiers.length;
  document.getElementById('stat-materiaux').textContent = data.materiaux.length;

  const enCours = data.chantiers.filter(c => c.statut === 'en-cours');
  const container = document.getElementById('dashboard-chantiers');
  if (enCours.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun chantier en cours.</div>';
    return;
  }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  enCours.forEach(c => {
    grid.innerHTML += buildChantierCard(c);
  });
  container.appendChild(grid);
}

// ===== MODULE CLIENTS =====
function renderClients() {
  const query = (document.getElementById('search-clients')?.value || '').toLowerCase();
  const list = data.clients.filter(c =>
    c.nom.toLowerCase().includes(query) ||
    (c.tel || '').includes(query) ||
    (c.email || '').toLowerCase().includes(query)
  );
  const container = document.getElementById('clients-list');
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun client enregistré. Cliquez sur "+ Nouveau client" pour commencer.</div>';
    return;
  }
  container.innerHTML = list.map(c => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${c.nom}</div>
        <div class="card-actions">
          <button class="btn btn-icon btn-sm" onclick="editClient('${c.id}')" title="Modifier">✏️</button>
          <button class="btn btn-icon btn-sm btn-danger" onclick="deleteClient('${c.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>
      ${c.tel   ? `<div class="card-detail">📞 ${c.tel}</div>` : ''}
      ${c.email ? `<div class="card-detail">✉️ ${c.email}</div>` : ''}
      ${c.adresse ? `<div class="card-detail">📍 ${c.adresse}</div>` : ''}
      ${c.notes ? `<div class="card-detail" style="color:#6b7280;font-style:italic">${c.notes}</div>` : ''}
    </div>
  `).join('');
}

function saveClient(e) {
  e.preventDefault();
  const id = document.getElementById('client-id').value;
  const client = {
    id:      id || uid(),
    nom:     document.getElementById('client-nom').value.trim(),
    tel:     document.getElementById('client-tel').value.trim(),
    email:   document.getElementById('client-email').value.trim(),
    adresse: document.getElementById('client-adresse').value.trim(),
    notes:   document.getElementById('client-notes').value.trim(),
  };
  if (id) {
    const idx = data.clients.findIndex(c => c.id === id);
    data.clients[idx] = client;
    toast('Client modifié ✓');
  } else {
    data.clients.push(client);
    toast('Client ajouté ✓');
  }
  save('clients');
  closeModal('modal-client');
  renderClients();
  updateClientSelects();
}

function editClient(id) {
  const c = data.clients.find(c => c.id === id);
  document.getElementById('modal-client-title').textContent = 'Modifier le client';
  document.getElementById('client-id').value      = c.id;
  document.getElementById('client-nom').value     = c.nom;
  document.getElementById('client-tel').value     = c.tel || '';
  document.getElementById('client-email').value   = c.email || '';
  document.getElementById('client-adresse').value = c.adresse || '';
  document.getElementById('client-notes').value   = c.notes || '';
  openModal('modal-client');
}

function deleteClient(id) {
  if (!confirm('Supprimer ce client ?')) return;
  data.clients = data.clients.filter(c => c.id !== id);
  save('clients');
  renderClients();
  toast('Client supprimé');
}

// Réinitialise le formulaire quand on clique "+ Nouveau client"
document.querySelector('[onclick="openModal(\'modal-client\')"]').addEventListener('click', () => {
  document.getElementById('modal-client-title').textContent = 'Nouveau client';
  document.getElementById('form-client').reset();
  document.getElementById('client-id').value = '';
  updateClientSelects();
});

// ===== MODULE DEVIS =====
let lignesDevis = [];

function renderDevis() {
  const container = document.getElementById('devis-list');
  if (data.devis.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun devis. Cliquez sur "+ Nouveau devis" pour commencer.</div>';
    return;
  }
  container.innerHTML = data.devis.map(d => {
    const client = data.clients.find(c => c.id === d.clientId);
    const total = d.lignes.reduce((s, l) => s + (l.qte * l.prix), 0);
    return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${client ? client.nom : 'Client inconnu'}</div>
          <div class="card-detail">${d.date || ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span class="badge badge-${d.statut}">${labelStatut(d.statut)}</span>
          <div class="card-actions">
            <button class="btn btn-icon btn-sm" onclick="editDevis('${d.id}')">✏️</button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="deleteDevis('${d.id}')">🗑️</button>
          </div>
        </div>
      </div>
      <div class="card-detail" style="margin-top:8px">${d.description}</div>
      <div style="font-weight:700;color:var(--primary);margin-top:10px">${formatEuro(total)}</div>
    </div>
  `}).join('');
}

function openModalDevis() {
  document.getElementById('modal-devis-title').textContent = 'Nouveau devis';
  document.getElementById('form-devis').reset();
  document.getElementById('devis-id').value = '';
  document.getElementById('devis-date').value = today();
  lignesDevis = [];
  renderLignes();
  ajouterLigne();
  updateClientSelects();
  openModal('modal-devis');
}
document.querySelector('[onclick="openModal(\'modal-devis\')"]').addEventListener('click', openModalDevis);

function ajouterLigne() {
  lignesDevis.push({ desc: '', qte: 1, prix: 0 });
  renderLignes();
}

function renderLignes() {
  const container = document.getElementById('devis-lignes');
  const header = container.querySelector('.ligne-header');
  container.innerHTML = '';
  if (header) container.appendChild(header);
  else {
    const h = document.createElement('div');
    h.className = 'ligne-header';
    h.innerHTML = '<span>Description</span><span>Qté</span><span>Prix unit. (€)</span><span>Total</span><span></span>';
    container.appendChild(h);
  }
  lignesDevis.forEach((l, i) => {
    const div = document.createElement('div');
    div.className = 'ligne-devis';
    div.innerHTML = `
      <input type="text"   value="${l.desc}" placeholder="Prestation..." oninput="lignesDevis[${i}].desc=this.value" />
      <input type="number" value="${l.qte}"  min="0" oninput="lignesDevis[${i}].qte=+this.value;calcTotal()" />
      <input type="number" value="${l.prix}" min="0" step="0.01" oninput="lignesDevis[${i}].prix=+this.value;calcTotal()" />
      <span style="font-weight:600">${formatEuro(l.qte * l.prix)}</span>
      <button type="button" class="btn btn-icon btn-sm btn-danger" onclick="supprimerLigne(${i})">✕</button>
    `;
    container.appendChild(div);
  });
  calcTotal();
}

function supprimerLigne(i) {
  lignesDevis.splice(i, 1);
  renderLignes();
}

function calcTotal() {
  const total = lignesDevis.reduce((s, l) => s + (l.qte * l.prix), 0);
  document.getElementById('devis-total-display').textContent = formatEuro(total);
  // Met à jour les sous-totaux affichés
  document.querySelectorAll('.ligne-devis').forEach((row, i) => {
    const spans = row.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = formatEuro(lignesDevis[i].qte * lignesDevis[i].prix);
  });
}

function saveDevis(e) {
  e.preventDefault();
  const id = document.getElementById('devis-id').value;
  const devis = {
    id:          id || uid(),
    clientId:    document.getElementById('devis-client').value,
    date:        document.getElementById('devis-date').value,
    description: document.getElementById('devis-description').value.trim(),
    lignes:      [...lignesDevis],
    statut:      document.getElementById('devis-statut').value,
  };
  if (id) {
    data.devis[data.devis.findIndex(d => d.id === id)] = devis;
    toast('Devis modifié ✓');
  } else {
    data.devis.push(devis);
    toast('Devis ajouté ✓');
  }
  save('devis');
  closeModal('modal-devis');
  renderDevis();
}

function editDevis(id) {
  const d = data.devis.find(d => d.id === id);
  document.getElementById('modal-devis-title').textContent = 'Modifier le devis';
  document.getElementById('devis-id').value          = d.id;
  document.getElementById('devis-description').value = d.description;
  document.getElementById('devis-date').value        = d.date || '';
  document.getElementById('devis-statut').value      = d.statut;
  lignesDevis = d.lignes.map(l => ({ ...l }));
  updateClientSelects();
  setTimeout(() => {
    document.getElementById('devis-client').value = d.clientId;
  }, 10);
  renderLignes();
  openModal('modal-devis');
}

function deleteDevis(id) {
  if (!confirm('Supprimer ce devis ?')) return;
  data.devis = data.devis.filter(d => d.id !== id);
  save('devis');
  renderDevis();
  toast('Devis supprimé');
}

// ===== MODULE CHANTIERS =====
function renderChantiers() {
  const container = document.getElementById('chantiers-list');
  if (data.chantiers.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun chantier. Cliquez sur "+ Nouveau chantier" pour commencer.</div>';
    return;
  }
  container.innerHTML = data.chantiers.map(c => buildChantierCard(c)).join('');
}

function buildChantierCard(c) {
  const client = data.clients.find(cl => cl.id === c.clientId);
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${c.nom}</div>
          ${client ? `<div class="card-detail">👤 ${client.nom}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span class="badge badge-${c.statut}">${labelStatut(c.statut)}</span>
          <div class="card-actions">
            <button class="btn btn-icon btn-sm" onclick="editChantier('${c.id}')">✏️</button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="deleteChantier('${c.id}')">🗑️</button>
          </div>
        </div>
      </div>
      ${c.debut ? `<div class="card-detail">📅 Début : ${c.debut}</div>` : ''}
      ${c.fin   ? `<div class="card-detail">🏁 Fin prévue : ${c.fin}</div>` : ''}
      ${c.notes ? `<div class="card-detail" style="font-style:italic">${c.notes}</div>` : ''}
      <div class="progress-bar">
        <div class="progress-fill" style="width:${c.avancement || 0}%"></div>
      </div>
      <div style="font-size:12px;color:var(--gray-600);margin-top:4px">Avancement : ${c.avancement || 0}%</div>
    </div>
  `;
}

function saveChantier(e) {
  e.preventDefault();
  const id = document.getElementById('chantier-id').value;
  const chantier = {
    id:          id || uid(),
    nom:         document.getElementById('chantier-nom').value.trim(),
    clientId:    document.getElementById('chantier-client').value,
    debut:       document.getElementById('chantier-debut').value,
    fin:         document.getElementById('chantier-fin').value,
    avancement:  +document.getElementById('chantier-avancement').value,
    statut:      document.getElementById('chantier-statut').value,
    notes:       document.getElementById('chantier-notes').value.trim(),
  };
  if (id) {
    data.chantiers[data.chantiers.findIndex(c => c.id === id)] = chantier;
    toast('Chantier modifié ✓');
  } else {
    data.chantiers.push(chantier);
    toast('Chantier ajouté ✓');
  }
  save('chantiers');
  closeModal('modal-chantier');
  renderChantiers();
}

function editChantier(id) {
  const c = data.chantiers.find(c => c.id === id);
  document.getElementById('modal-chantier-title').textContent = 'Modifier le chantier';
  document.getElementById('chantier-id').value          = c.id;
  document.getElementById('chantier-nom').value         = c.nom;
  document.getElementById('chantier-debut').value       = c.debut || '';
  document.getElementById('chantier-fin').value         = c.fin || '';
  document.getElementById('chantier-avancement').value  = c.avancement || 0;
  document.getElementById('avancement-val').textContent = (c.avancement || 0) + '%';
  document.getElementById('chantier-statut').value      = c.statut;
  document.getElementById('chantier-notes').value       = c.notes || '';
  updateClientSelects();
  setTimeout(() => {
    document.getElementById('chantier-client').value = c.clientId || '';
  }, 10);
  openModal('modal-chantier');
}

function deleteChantier(id) {
  if (!confirm('Supprimer ce chantier ?')) return;
  data.chantiers = data.chantiers.filter(c => c.id !== id);
  save('chantiers');
  renderChantiers();
  toast('Chantier supprimé');
}

document.querySelector('[onclick="openModal(\'modal-chantier\')"]').addEventListener('click', () => {
  document.getElementById('modal-chantier-title').textContent = 'Nouveau chantier';
  document.getElementById('form-chantier').reset();
  document.getElementById('chantier-id').value = '';
  document.getElementById('avancement-val').textContent = '0%';
  updateClientSelects();
});

// ===== MODULE MATÉRIAUX =====
function renderMateriaux() {
  const container = document.getElementById('materiaux-list');
  if (data.materiaux.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun article en stock. Cliquez sur "+ Ajouter article".</div>';
    return;
  }
  container.innerHTML = data.materiaux.map(m => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${m.nom}</div>
          ${m.categorie ? `<div class="card-detail" style="color:var(--primary);font-weight:500">${m.categorie}</div>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-icon btn-sm" onclick="editMateriau('${m.id}')">✏️</button>
          <button class="btn btn-icon btn-sm btn-danger" onclick="deleteMateriau('${m.id}')">🗑️</button>
        </div>
      </div>
      <div class="card-detail">📦 Stock : <strong>${m.stock} ${m.unite}</strong></div>
      <div class="card-detail">💶 Prix : <strong>${formatEuro(m.prix)} / ${m.unite}</strong></div>
      ${m.fournisseur ? `<div class="card-detail">🏪 ${m.fournisseur}</div>` : ''}
      <div style="font-weight:700;color:var(--primary);margin-top:8px">
        Valeur stock : ${formatEuro(m.stock * m.prix)}
      </div>
    </div>
  `).join('');
}

function saveMateriau(e) {
  e.preventDefault();
  const id = document.getElementById('materiau-id').value;
  const m = {
    id:          id || uid(),
    nom:         document.getElementById('materiau-nom').value.trim(),
    categorie:   document.getElementById('materiau-categorie').value.trim(),
    unite:       document.getElementById('materiau-unite').value,
    stock:       +document.getElementById('materiau-stock').value,
    prix:        +document.getElementById('materiau-prix').value,
    fournisseur: document.getElementById('materiau-fournisseur').value.trim(),
  };
  if (id) {
    data.materiaux[data.materiaux.findIndex(x => x.id === id)] = m;
    toast('Article modifié ✓');
  } else {
    data.materiaux.push(m);
    toast('Article ajouté ✓');
  }
  save('materiaux');
  closeModal('modal-materiau');
  renderMateriaux();
}

function editMateriau(id) {
  const m = data.materiaux.find(m => m.id === id);
  document.getElementById('modal-materiau-title').textContent = 'Modifier l\'article';
  document.getElementById('materiau-id').value          = m.id;
  document.getElementById('materiau-nom').value         = m.nom;
  document.getElementById('materiau-categorie').value   = m.categorie || '';
  document.getElementById('materiau-unite').value       = m.unite;
  document.getElementById('materiau-stock').value       = m.stock;
  document.getElementById('materiau-prix').value        = m.prix;
  document.getElementById('materiau-fournisseur').value = m.fournisseur || '';
  openModal('modal-materiau');
}

function deleteMateriau(id) {
  if (!confirm('Supprimer cet article ?')) return;
  data.materiaux = data.materiaux.filter(m => m.id !== id);
  save('materiaux');
  renderMateriaux();
  toast('Article supprimé');
}

document.querySelector('[onclick="openModal(\'modal-materiau\')"]').addEventListener('click', () => {
  document.getElementById('modal-materiau-title').textContent = 'Nouvel article';
  document.getElementById('form-materiau').reset();
  document.getElementById('materiau-id').value = '';
});

// ===== UTILITAIRES =====

// Met à jour les listes déroulantes de clients dans les formulaires
function updateClientSelects() {
  const selects = ['devis-client', 'chantier-client'];
  selects.forEach(selectId => {
    const sel = document.getElementById(selectId);
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Sélectionner un client --</option>';
    data.clients.forEach(c => {
      sel.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
    });
    sel.value = current;
  });
}

// Formate un nombre en euros
function formatEuro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
}

// Retourne la date du jour au format YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0];
}

// Traduit un code de statut en texte lisible
function labelStatut(s) {
  const labels = {
    brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé',
    planifie: 'Planifié', 'en-cours': 'En cours', termine: 'Terminé', pause: 'En pause',
  };
  return labels[s] || s;
}

// ===== INITIALISATION =====
updateClientSelects();
renderDashboard();
