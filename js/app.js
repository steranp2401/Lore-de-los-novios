// Configuración Real de Supabase
const SUPABASE_URL = "https://sdmlcxqlrywncxtezjsn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vVuqmA40xDlawc6AhCT1TQ_yZ-j2wz7";

// Usamos 'db' para evitar el conflicto de nombres con la librería global
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let simsData = [];
let extraLore = [];
let housesData = [];
let petsData = [];

let isListMode = false;
let searchQuery = "";

// Cargar todo desde Supabase al iniciar
async function loadAllData() {
  try {
    await Promise.all([
      fetchSims(),
      fetchLore(),
      fetchHouses(),
      fetchPets()
    ]);
  } catch (err) {
    console.error("Error cargando datos de Supabase:", err);
  } finally {
    renderAll();
  }
}

// FETCH FUNCTIONS (Supabase)
async function fetchSims() {
  const { data, error } = await db.from('sims').select('*').order('id', { ascending: true });
  if (!error && data) simsData = data;
}

async function fetchLore() {
  const { data, error } = await db.from('lore_events').select('*').order('id', { ascending: true });
  if (!error && data) extraLore = data;
}

async function fetchHouses() {
  const { data, error } = await db.from('houses').select('*').order('id', { ascending: true });
  if (!error && data) housesData = data;
}

async function fetchPets() {
  const { data, error } = await db.from('pets').select('*').order('id', { ascending: true });
  if (!error && data) petsData = data;
}

// Cambio de Pestañas
window.switchTab = function(tabId, ev) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (ev && ev.target) {
    ev.target.classList.add('active');
  }
};

// Modal Manager
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
};

window.openSimModal = function(parentId = null) {
  const parentIdInput = document.getElementById('simParentId');
  const simForm = document.getElementById('simForm');
  if (parentIdInput) parentIdInput.value = parentId || "";
  if (simForm) simForm.reset();
  
  const select = document.getElementById('simParentSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Ninguno (Fundador Raíz) --</option>';
    simsData.forEach(sim => {
      select.innerHTML += `<option value="${sim.id}">${sim.name} (${sim.generation || ''})</option>`;
    });
    if (parentId) select.value = parentId;
  }
  window.openModal('simModal');
};

window.openLoreModal = function() { window.openModal('loreModal'); };
window.openHouseModal = function() { window.openModal('houseModal'); };
window.openPetModal = function() { window.openModal('petModal'); };

// Toggle View Mode
window.toggleTreeViewMode = function() {
  isListMode = !isListMode;
  const btn = document.getElementById('toggleViewBtn');
  if (btn) btn.innerText = isListMode ? "Vista Árbol" : "Vista Lista";
  renderTree();
};

// SAVE FUNCTIONS
window.saveSim = async function(e) {
  e.preventDefault();
  const parentSelectVal = document.getElementById('simParentSelect').value;

  const newSim = {
    parent_id: parentSelectVal ? parentSelectVal : null,
    name: document.getElementById('simName').value,
    generation: document.getElementById('simGen').value,
    traits: document.getElementById('simTraits').value || "Sin rasgos",
    house: document.getElementById('simHouse').value || "",
    lore: document.getElementById('simLore').value || "",
    family: "Principal",
    image_url: "",
    extra_info: ""
  };

  const { error } = await db.from('sims').insert([newSim]);
  if (error) {
    alert("Error al guardar Sim: " + error.message);
  } else {
    window.closeModal('simModal');
    await fetchSims();
    renderAll();
  }
};

window.saveLoreEvent = async function(e) {
  e.preventDefault();
  const newLore = {
    title: document.getElementById('loreTitle').value,
    sims: document.getElementById('loreSims').value || "Sims de la familia",
    desc: document.getElementById('loreDesc').value
  };

  const { error } = await db.from('lore_events').insert([newLore]);
  if (error) {
    alert("Error al guardar Lore: " + error.message);
  } else {
    window.closeModal('loreModal');
    await fetchLore();
    renderAll();
  }
};

window.saveHouse = async function(e) {
  e.preventDefault();
  const newHouse = {
    name: document.getElementById('houseName').value,
    world: document.getElementById('houseWorld').value || "Mundo Sim",
    desc: document.getElementById('houseDesc').value || ""
  };

  const { error } = await db.from('houses').insert([newHouse]);
  if (error) {
    alert("Error al guardar casa: " + error.message);
  } else {
    window.closeModal('houseModal');
    await fetchHouses();
    renderAll();
  }
};

window.savePet = async function(e) {
  e.preventDefault();
  const newPet = {
    name: document.getElementById('petName').value,
    meta: document.getElementById('petMeta').value || "Mascota",
    owner: document.getElementById('petOwner').value || "Familia",
    desc: document.getElementById('petDesc').value || ""
  };

  const { error } = await db.from('pets').insert([newPet]);
  if (error) {
    alert("Error al guardar mascota: " + error.message);
  } else {
    window.closeModal('petModal');
    await fetchPets();
    renderAll();
  }
};

// DELETE ITEM
window.deleteItem = async function(type, id) {
  let table = '';
  if (type === 'sim') table = 'sims';
  else if (type === 'lore') table = 'lore_events';
  else if (type === 'house') table = 'houses';
  else if (type === 'pet') table = 'pets';

  const { error } = await db.from(table).delete().eq('id', id);
  if (error) alert("Error al eliminar: " + error.message);

  await loadAllData();
};

// RENDER TREE
function renderTree() {
  const container = document.getElementById('treeView');
  if (!container) return;

  const filteredSims = simsData.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery)) ||
    (s.traits && s.traits.toLowerCase().includes(searchQuery))
  );

  if (filteredSims.length === 0) {
    container.innerHTML = `<div class="empty-state">No hay Sims creados aún. ¡Añade tu primer fundador!</div>`;
    return;
  }

  if (isListMode) {
    let html = '<div class="cards-grid" style="text-align:left;">';
    filteredSims.forEach(sim => {
      html += `
        <div class="info-card">
          <button class="delete-btn" onclick="deleteItem('sim', '${sim.id}')">✕</button>
          <h3>${sim.name}</h3>
          <div class="meta">${sim.generation || ''} • ${sim.traits || ''}</div>
          <p>${sim.lore || "Sin lore registrado."}</p>
          ${sim.house ? `<span class="card-footer-tag">🏡 ${sim.house}</span>` : ''}
          <div style="margin-top:8px;">
            <button class="mini-btn" onclick="openSimModal('${sim.id}')">+ Añadir Descendiente</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
    return;
  }

  function buildBranch(parentId) {
    const children = filteredSims.filter(s => String(s.parent_id) === String(parentId));
    if (children.length === 0) return '';

    let branchHtml = '<ul>';
    children.forEach(child => {
      branchHtml += `
        <li>
          <div class="sim-tree-card">
            <div class="sim-tree-header">
              <h4>${child.name}</h4>
              <span class="gen-badge">${child.generation || ''}</span>
            </div>
            <div class="sim-tree-meta">${child.traits || ''}</div>
            ${child.house ? `<div style="font-size:0.75rem; color:var(--text-muted);">🏡 ${child.house}</div>` : ''}
            <div class="sim-card-actions">
              <button class="mini-btn" onclick="openSimModal('${child.id}')">+ Descendiente</button>
              <button class="mini-btn" onclick="deleteItem('sim', '${child.id}')">Eliminar</button>
            </div>
          </div>
          ${buildBranch(child.id)}
        </li>
      `;
    });
    branchHtml += '</ul>';
    return branchHtml;
  }

  const roots = filteredSims.filter(s => !s.parent_id);
  let treeHtml = '<ul>';
  
  if (roots.length > 0) {
    roots.forEach(root => {
      treeHtml += `
        <li>
          <div class="sim-tree-card">
            <div class="sim-tree-header">
              <h4>${root.name}</h4>
              <span class="gen-badge">${root.generation || ''}</span>
            </div>
            <div class="sim-tree-meta">${root.traits || ''}</div>
            ${root.house ? `<div style="font-size:0.75rem; color:var(--text-muted);">🏡 ${root.house}</div>` : ''}
            <div class="sim-card-actions">
              <button class="mini-btn" onclick="openSimModal('${root.id}')">+ Descendiente</button>
              <button class="mini-btn" onclick="deleteItem('sim', '${root.id}')">Eliminar</button>
            </div>
          </div>
          ${buildBranch(root.id)}
        </li>
      `;
    });
  } else {
    filteredSims.forEach(sim => {
      treeHtml += `
        <li>
          <div class="sim-tree-card">
            <h4>${sim.name}</h4>
            <div class="sim-tree-meta">${sim.generation || ''}</div>
          </div>
        </li>
      `;
    });
  }
  treeHtml += '</ul>';
  container.innerHTML = treeHtml;
}

// RENDER LORE
function renderLore() {
  const loreGrid = document.getElementById('loreGrid');
  if (!loreGrid) return;

  const filteredSims = simsData.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery)) ||
    (s.lore && s.lore.toLowerCase().includes(searchQuery))
  );

  const filteredExtraLore = extraLore.filter(l => 
    (l.title && l.title.toLowerCase().includes(searchQuery)) ||
    (l.desc && l.desc.toLowerCase().includes(searchQuery))
  );

  let html = '';

  filteredSims.forEach(sim => {
    html += `
      <div class="info-card">
        <button class="delete-btn" onclick="deleteItem('sim', '${sim.id}')">✕</button>
        <h3>${sim.name}</h3>
        <div class="meta">${sim.generation || ''} • ${sim.traits || ''}</div>
        <p>${sim.lore ? sim.lore : "Sin biografía escrita aún."}</p>
        ${sim.house ? `<span class="card-footer-tag">🏡 ${sim.house}</span>` : ''}
      </div>
    `;
  });

  filteredExtraLore.forEach(ev => {
    html += `
      <div class="info-card blue-theme">
        <button class="delete-btn" onclick="deleteItem('lore', '${ev.id}')">✕</button>
        <h3>${ev.title}</h3>
        <div class="meta">Involucrados: ${ev.sims || ''}</div>
        <p>${ev.desc}</p>
      </div>
    `;
  });

  if (!html) html = `<div class="empty-state">No hay eventos de historia o biografías de Sims registradas.</div>`;
  loreGrid.innerHTML = html;
}

// RENDER HOUSES
function renderHouses() {
  const housesGrid = document.getElementById('casasGrid');
  if (!housesGrid) return;

  const filtered = housesData.filter(h => 
    (h.name && h.name.toLowerCase().includes(searchQuery)) ||
    (h.world && h.world.toLowerCase().includes(searchQuery))
  );

  if (filtered.length === 0) {
    housesGrid.innerHTML = `<div class="empty-state">No se han registrado residencias o solares.</div>`;
    return;
  }

  housesGrid.innerHTML = filtered.map(h => `
    <div class="info-card pink-theme">
      <button class="delete-btn" onclick="deleteItem('house', '${h.id}')">✕</button>
      <h3>${h.name}</h3>
      <div class="meta">📍 Mundo: ${h.world}</div>
      <p>${h.desc || "Sin descripción adicional."}</p>
    </div>
  `).join('');
}

// RENDER PETS
function renderPets() {
  const mascotasGrid = document.getElementById('mascotasGrid');
  if (!mascotasGrid) return;

  const filtered = petsData.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchQuery)) ||
    (p.owner && p.owner.toLowerCase().includes(searchQuery))
  );

  if (filtered.length === 0) {
    mascotasGrid.innerHTML = `<div class="empty-state">No hay mascotas registradas en el legado.</div>`;
    return;
  }

  mascotasGrid.innerHTML = filtered.map(p => `
    <div class="info-card blue-theme">
      <button class="delete-btn" onclick="deleteItem('pet', '${p.id}')">✕</button>
      <h3>🐾 ${p.name}</h3>
      <div class="meta">${p.meta || ''} • Dueño: ${p.owner || ''}</div>
      <p>${p.desc || "Sin notas adicionales."}</p>
    </div>
  `).join('');
}

// STATS & SEARCH
function updateStats() {
  const elSims = document.getElementById('statSims');
  const elLore = document.getElementById('statLore');
  const elHouses = document.getElementById('statHouses');
  const elPets = document.getElementById('statPets');

  if (elSims) elSims.innerText = simsData.length;
  if (elLore) elLore.innerText = simsData.filter(s => s.lore).length + extraLore.length;
  if (elHouses) elHouses.innerText = housesData.length;
  if (elPets) elPets.innerText = petsData.length;
}

window.handleSearch = function() {
  const input = document.getElementById('searchInput');
  if (input) {
    searchQuery = input.value.toLowerCase().trim();
    renderAll();
  }
};

function renderAll() {
  renderTree();
  renderLore();
  renderHouses();
  renderPets();
  updateStats();
}

// Cargar todo al inicio
document.addEventListener('DOMContentLoaded', loadAllData);
