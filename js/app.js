const SUPABASE_URL = "https://sdmlcxqlrywncxtezjsn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vVuqmA40xDlawc6AhCT1TQ_yZ-j2wz7";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let simsData = [];
let extraLore = [];
let housesData = [];
let petsData = [];

let searchQuery = "";
let selectedFamily = "";

async function loadAllData() {
  try {
    await Promise.all([fetchSims(), fetchLore(), fetchHouses(), fetchPets()]);
  } catch (err) {
    console.error("Error cargando datos:", err);
  } finally {
    updateFamilyFilterOptions();
    renderAll();
  }
}

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

window.switchTab = function(tabId, ev) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-card').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');
};

window.openModal = function(id) { document.getElementById(id).style.display = 'flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.openSimModal = function(parentId = null, editId = null) {
  document.getElementById('simForm').reset();
  document.getElementById('simId').value = "";

  const fatherSelect = document.getElementById('simFatherSelect');
  const motherSelect = document.getElementById('simMotherSelect');
  
  fatherSelect.innerHTML = '<option value="">-- Ninguno --</option>';
  motherSelect.innerHTML = '<option value="">-- Ninguna --</option>';

  simsData.forEach(sim => {
    fatherSelect.innerHTML += `<option value="${sim.id}">${sim.name} (${sim.generation || ''})</option>`;
    motherSelect.innerHTML += `<option value="${sim.id}">${sim.name} (${sim.generation || ''})</option>`;
  });

  if (parentId) {
    fatherSelect.value = parentId;
  }

  if (editId) {
    document.getElementById('simModalTitle').innerText = "Editar Sim";
    const sim = simsData.find(s => String(s.id) === String(editId));
    if (sim) {
      document.getElementById('simId').value = sim.id;
      document.getElementById('simName').value = sim.name || "";
      document.getElementById('simFamily').value = sim.family || "";
      document.getElementById('simGen').value = sim.generation || "Generación 1";
      fatherSelect.value = sim.father_id || "";
      motherSelect.value = sim.mother_id || "";
      document.getElementById('simSpouse').value = sim.spouse || "";
      document.getElementById('simImage').value = sim.image_url || "";
      document.getElementById('simTraits').value = sim.traits || "";
      document.getElementById('simHouse').value = sim.house || "";
      document.getElementById('simLore').value = sim.lore || "";
    }
  } else {
    document.getElementById('simModalTitle').innerText = "Añadir Nuevo Sim";
  }
  window.openModal('simModal');
};

window.saveSim = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('simId').value;
  const fatherVal = document.getElementById('simFatherSelect').value;
  const motherVal = document.getElementById('simMotherSelect').value;

  const simPayload = {
    father_id: fatherVal ? fatherVal : null,
    mother_id: motherVal ? motherVal : null,
    name: document.getElementById('simName').value,
    family: document.getElementById('simFamily').value || "Principal",
    generation: document.getElementById('simGen').value,
    spouse: document.getElementById('simSpouse').value || "",
    image_url: document.getElementById('simImage').value || "",
    traits: document.getElementById('simTraits').value || "Sin rasgos",
    house: document.getElementById('simHouse').value || "", // Hogar vinculado a Casas
    lore: document.getElementById('simLore').value || ""    // Biografía vinculada a Historia
  };

  let error;
  if (editId) {
    const res = await db.from('sims').update(simPayload).eq('id', editId);
    error = res.error;
  } else {
    const res = await db.from('sims').insert([simPayload]);
    error = res.error;
  }

  if (error) {
    alert("Error al guardar Sim: " + error.message);
  } else {
    window.closeModal('simModal');
    await fetchSims();
    updateFamilyFilterOptions();
    renderAll();
  }
};

window.openLoreModal = function(editId = null) {
  document.getElementById('loreId').value = "";
  document.getElementById('loreTitle').value = "";
  document.getElementById('loreSims').value = "";
  document.getElementById('loreDesc').value = "";

  if (editId) {
    const ev = extraLore.find(l => String(l.id) === String(editId));
    if (ev) {
      document.getElementById('loreId').value = ev.id;
      document.getElementById('loreTitle').value = ev.title || "";
      document.getElementById('loreSims').value = ev.sims || "";
      document.getElementById('loreDesc').value = ev.desc || "";
    }
  }
  window.openModal('loreModal');
};

window.saveLoreEvent = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('loreId').value;
  const payload = {
    title: document.getElementById('loreTitle').value,
    sims: document.getElementById('loreSims').value || "",
    desc: document.getElementById('loreDesc').value
  };

  let error;
  if (editId) {
    const res = await db.from('lore_events').update(payload).eq('id', editId);
    error = res.error;
  } else {
    const res = await db.from('lore_events').insert([payload]);
    error = res.error;
  }

  if (error) alert("Error: " + error.message);
  else {
    window.closeModal('loreModal');
    await fetchLore();
    renderAll();
  }
};

window.openHouseModal = function(editId = null) {
  document.getElementById('houseId').value = "";
  document.getElementById('houseName').value = "";
  document.getElementById('houseWorld').value = "";
  document.getElementById('houseSims').value = "";
  document.getElementById('houseDesc').value = "";

  if (editId) {
    const h = housesData.find(item => String(item.id) === String(editId));
    if (h) {
      document.getElementById('houseId').value = h.id;
      document.getElementById('houseName').value = h.name || "";
      document.getElementById('houseWorld').value = h.world || "";
      document.getElementById('houseSims').value = h.sims || "";
      document.getElementById('houseDesc').value = h.desc || "";
    }
  }
  window.openModal('houseModal');
};

window.saveHouse = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('houseId').value;
  const payload = {
    name: document.getElementById('houseName').value,
    world: document.getElementById('houseWorld').value || "",
    sims: document.getElementById('houseSims').value || "",
    desc: document.getElementById('houseDesc').value || ""
  };

  let error;
  if (editId) {
    const res = await db.from('houses').update(payload).eq('id', editId);
    error = res.error;
  } else {
    const res = await db.from('houses').insert([payload]);
    error = res.error;
  }

  if (error) alert("Error: " + error.message);
  else {
    window.closeModal('houseModal');
    await fetchHouses();
    renderAll();
  }
};

window.openPetModal = function(parentId = null, editId = null) {
  document.getElementById('petId').value = "";
  document.getElementById('petName').value = "";
  document.getElementById('petMeta').value = "";
  document.getElementById('petOwner').value = "";
  document.getElementById('petImage').value = "";
  document.getElementById('petDesc').value = "";

  const select = document.getElementById('petParentSelect');
  select.innerHTML = '<option value="">-- Ninguno (Fundador) --</option>';
  petsData.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.name} (${p.meta || ''})</option>`;
  });
  if (parentId) select.value = parentId;

  if (editId) {
    const pet = petsData.find(item => String(item.id) === String(editId));
    if (pet) {
      document.getElementById('petId').value = pet.id;
      document.getElementById('petName').value = pet.name || "";
      select.value = pet.parent_id || "";
      document.getElementById('petMeta').value = pet.meta || "";
      document.getElementById('petOwner').value = pet.owner || "";
      document.getElementById('petImage').value = pet.image_url || "";
      document.getElementById('petDesc').value = pet.desc || "";
    }
  }
  window.openModal('petModal');
};

window.savePet = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('petId').value;
  const parentSelectVal = document.getElementById('petParentSelect').value;

  const payload = {
    parent_id: parentSelectVal ? parentSelectVal : null,
    name: document.getElementById('petName').value,
    meta: document.getElementById('petMeta').value || "",
    owner: document.getElementById('petOwner').value || "",
    image_url: document.getElementById('petImage').value || "",
    desc: document.getElementById('petDesc').value || ""
  };

  let error;
  if (editId) {
    const res = await db.from('pets').update(payload).eq('id', editId);
    error = res.error;
  } else {
    const res = await db.from('pets').insert([payload]);
    error = res.error;
  }

  if (error) alert("Error: " + error.message);
  else {
    window.closeModal('petModal');
    await fetchPets();
    renderAll();
  }
};

window.deleteItem = async function(type, id) {
  if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
  let table = type === 'sim' ? 'sims' : type === 'lore' ? 'lore_events' : type === 'house' ? 'houses' : 'pets';
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) alert("Error: " + error.message);
  await loadAllData();
};

function updateFamilyFilterOptions() {
  const select = document.getElementById('familyFilter');
  if (!select) return;
  const families = [...new Set(simsData.map(s => s.family).filter(Boolean))];
  let html = '<option value="">Todas las familias</option>';
  families.forEach(f => {
    html += `<option value="${f}" ${selectedFamily === f ? 'selected' : ''}>${f}</option>`;
  });
  select.innerHTML = html;
}

window.handleFamilyFilter = function() {
  const select = document.getElementById('familyFilter');
  selectedFamily = select ? select.value : "";
  renderTree();
};

// --- RENDER ÁRBOL GENEALÓGICO RECURSIVO CON PAREJAS ---
function renderTree() {
  const container = document.getElementById('treeView');
  if (!container) return;

  let filteredSims = simsData.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery)) ||
    (s.traits && s.traits.toLowerCase().includes(searchQuery))
  );

  if (selectedFamily) {
    filteredSims = filteredSims.filter(s => s.family === selectedFamily);
  }

  if (filteredSims.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:40px; color:#6e6592;">No hay Sims en esta familia. ¡Añade tu primer fundador!</div>`;
    return;
  }

  function renderSingleCard(sim) {
    const avatarContent = sim.image_url ? `<img src="${sim.image_url}" alt="Sim">` : `🔮`;
    return `
      <div class="sim-tree-card">
        <div class="sim-avatar">${avatarContent}</div>
        <h4>${sim.name}</h4>
        <div class="sim-tree-meta">${sim.generation || ''}</div>
        ${sim.spouse ? `<div style="font-size:0.75rem; color:#7c52f6; font-weight:600;">💍 ${sim.spouse}</div>` : ''}
        ${sim.traits ? `<div style="font-size:0.7rem; color:#6e6592; margin-top:2px;">${sim.traits}</div>` : ''}
        <div class="card-actions-bottom">
          <button class="mini-btn" onclick="openSimModal(null, '${sim.id}')">Editar</button>
          <button class="mini-btn" onclick="openSimModal('${sim.id}')">+ Hijo</button>
          <button class="mini-btn" onclick="deleteItem('sim', '${sim.id}')" style="color:#ff4d4d;">✕</button>
        </div>
      </div>
    `;
  }

  const renderedSimIds = new Set();

  function buildRecursiveTree(parentIds) {
    const children = filteredSims.filter(s => 
      (parentIds.includes(String(s.father_id)) || parentIds.includes(String(s.mother_id))) &&
      !renderedSimIds.has(String(s.id))
    );

    if (children.length === 0) return '';

    let branchHtml = '<ul>';
    
    children.forEach(child => {
      if (renderedSimIds.has(String(child.id))) return;

      const partner = filteredSims.find(p => 
        String(p.id) !== String(child.id) &&
        !renderedSimIds.has(String(p.id)) &&
        (
          (child.spouse && p.name && p.name.toLowerCase().includes(child.spouse.toLowerCase())) ||
          (p.spouse && child.name && child.name.toLowerCase().includes(p.spouse.toLowerCase())) ||
          filteredSims.some(grandchild => 
            (String(grandchild.father_id) === String(child.id) && String(grandchild.mother_id) === String(p.id)) ||
            (String(grandchild.mother_id) === String(child.id) && String(grandchild.father_id) === String(p.id))
          )
        )
      );

      renderedSimIds.add(String(child.id));

      if (partner) {
        renderedSimIds.add(String(partner.id));
        branchHtml += `
          <li>
            <div class="couple-container">
              ${renderSingleCard(child)}
              <div class="couple-heart">💍</div>
              ${renderSingleCard(partner)}
            </div>
            ${buildRecursiveTree([String(child.id), String(partner.id)])}
          </li>
        `;
      } else {
        branchHtml += `
          <li>
            ${renderSingleCard(child)}
            ${buildRecursiveTree([String(child.id)])}
          </li>
        `;
      }
    });

    branchHtml += '</ul>';
    return branchHtml;
  }

  const rootSims = filteredSims.filter(s => !s.father_id && !s.mother_id);
  let treeHtml = '<ul>';

  rootSims.forEach(sim => {
    if (renderedSimIds.has(String(sim.id))) return;

    const partner = rootSims.find(p => 
      String(p.id) !== String(sim.id) && 
      !renderedSimIds.has(String(p.id)) &&
      (
        (sim.spouse && p.name && p.name.toLowerCase().includes(sim.spouse.toLowerCase())) ||
        (p.spouse && sim.name && sim.name.toLowerCase().includes(p.spouse.toLowerCase())) ||
        filteredSims.some(child => 
          (String(child.father_id) === String(sim.id) && String(child.mother_id) === String(p.id)) ||
          (String(child.mother_id) === String(sim.id) && String(child.father_id) === String(p.id))
        )
      )
    );

    renderedSimIds.add(String(sim.id));

    if (partner) {
      renderedSimIds.add(String(partner.id));
      treeHtml += `
        <li>
          <div class="couple-container">
            ${renderSingleCard(sim)}
            <div class="couple-heart">💍</div>
            ${renderSingleCard(partner)}
          </div>
          ${buildRecursiveTree([String(sim.id), String(partner.id)])}
        </li>
      `;
    } else {
      treeHtml += `
        <li>
          ${renderSingleCard(sim)}
          ${buildRecursiveTree([String(sim.id)])}
        </li>
      `;
    }
  });

  treeHtml += '</ul>';
  container.innerHTML = treeHtml;
}

function renderPetTree() {
  const container = document.getElementById('petTreeView');
  if (!container) return;

  const filteredPets = petsData.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchQuery)) ||
    (p.meta && p.meta.toLowerCase().includes(searchQuery))
  );

  if (filteredPets.length === 0) {
    container.innerHTML = `<div style="padding:15px; color:#6e6592; font-size:0.8rem;">No hay linaje de mascotas registrado.</div>`;
    return;
  }

  function buildPetBranch(parentId) {
    const children = filteredPets.filter(p => String(p.parent_id) === String(parentId));
    if (children.length === 0) return '';

    let branchHtml = '<ul>';
    children.forEach(child => {
      const avatarContent = child.image_url ? `<img src="${child.image_url}" alt="Mascota">` : `🐾`;
      branchHtml += `
        <li>
          <div class="sim-tree-card" style="width:140px;">
            <div class="sim-avatar">${avatarContent}</div>
            <h4>${child.name}</h4>
            <div class="sim-tree-meta">${child.meta || ''}</div>
            <div class="card-actions-bottom">
              <button class="mini-btn" onclick="openPetModal(null, '${child.id}')">Editar</button>
              <button class="mini-btn" onclick="openPetModal('${child.id}')">+ Cachorro</button>
            </div>
          </div>
          ${buildPetBranch(child.id)}
        </li>
      `;
    });
    branchHtml += '</ul>';
    return branchHtml;
  }

  const roots = filteredPets.filter(p => !p.parent_id);
  let treeHtml = '<ul>';
  roots.forEach(root => {
    const avatarContent = root.image_url ? `<img src="${root.image_url}" alt="Mascota">` : `🐾`;
    treeHtml += `
      <li>
        <div class="sim-tree-card" style="width:140px;">
          <div class="sim-avatar">${avatarContent}</div>
          <h4>${root.name}</h4>
          <div class="sim-tree-meta">${root.meta || ''}</div>
          <div class="card-actions-bottom">
            <button class="mini-btn" onclick="openPetModal(null, '${root.id}')">Editar</button>
            <button class="mini-btn" onclick="openPetModal('${root.id}')">+ Cachorro</button>
          </div>
        </div>
        ${buildPetBranch(root.id)}
      </li>
    `;
  });
  treeHtml += '</ul>';
  container.innerHTML = treeHtml;
}

// --- RENDER HISTORIA ---
function renderLore() {
  const loreGrid = document.getElementById('loreGrid');
  if (!loreGrid) return;
  let html = '';

  const simsWithLore = simsData.filter(s => s.lore && s.lore.trim() !== "");
  simsWithLore.forEach(sim => {
    if (searchQuery && !sim.name.toLowerCase().includes(searchQuery) && !sim.lore.toLowerCase().includes(searchQuery)) return;
    html += `
      <div class="info-card">
        <button class="delete-btn" onclick="deleteItem('sim', '${sim.id}')">✕</button>
        <h3>👤 ${sim.name}</h3>
        <div class="meta" style="color:#7c52f6; font-size:0.78rem;">${sim.generation || ''} • ${sim.traits || ''}</div>
        <p style="font-size:0.85rem;">${sim.lore}</p>
        ${sim.house ? `<div style="font-size:0.75rem; color:#4c6ef5; font-weight:600; margin-top:4px;">🏡 ${sim.house}</div>` : ''}
        <div class="card-actions-bottom">
          <button class="mini-btn" onclick="openSimModal(null, '${sim.id}')">Editar Sim</button>
        </div>
      </div>
    `;
  });

  extraLore.forEach(ev => {
    if (searchQuery && !ev.title.toLowerCase().includes(searchQuery) && !ev.desc.toLowerCase().includes(searchQuery)) return;
    html += `
      <div class="info-card">
        <button class="delete-btn" onclick="deleteItem('lore', '${ev.id}')">✕</button>
        <h3>📖 ${ev.title}</h3>
        <div class="meta" style="color:#7c52f6; font-size:0.78rem;">Sims: ${ev.sims || ''}</div>
        <p style="font-size:0.85rem;">${ev.desc}</p>
        <div class="card-actions-bottom">
          <button class="mini-btn" onclick="openLoreModal('${ev.id}')">Editar Capítulo</button>
        </div>
      </div>
    `;
  });

  if (!html) html = `<div class="empty-state">No hay eventos de historia ni biografías de Sims registradas.</div>`;
  loreGrid.innerHTML = html;
}

// --- RENDER CASAS ---
function renderHouses() {
  const housesGrid = document.getElementById('casasGrid');
  if (!housesGrid) return;
  let html = '';

  housesData.forEach(h => {
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery) && !h.world.toLowerCase().includes(searchQuery)) return;

    const residentSims = simsData.filter(s => s.house && s.house.toLowerCase().trim() === h.name.toLowerCase().trim());
    let residentNames = residentSims.map(s => s.name).join(', ');
    let finalResidents = residentNames || h.sims || 'Sin asignación';

    html += `
      <div class="info-card">
        <button class="delete-btn" onclick="deleteItem('house', '${h.id}')">✕</button>
        <h3>🏰 ${h.name}</h3>
        <div class="meta" style="font-size:0.78rem;">📍 Mundo: ${h.world || 'Mundo Sim'}</div>
        <div class="meta" style="color:#7c52f6; font-size:0.78rem;">👥 Residentes: ${finalResidents}</div>
        <p style="font-size:0.85rem;">${h.desc || "Sin notas."}</p>
        <div class="card-actions-bottom">
          <button class="mini-btn" onclick="openHouseModal('${h.id}')">Editar Residencia</button>
        </div>
      </div>
    `;
  });

  if (!html) html = `<div class="empty-state">No hay residencias registradas.</div>`;
  housesGrid.innerHTML = html;
}

function renderPets() {
  renderPetTree();
  const mascotasGrid = document.getElementById('mascotasGrid');
  if (!mascotasGrid) return;
  let html = '';

  petsData.forEach(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery) && !p.owner.toLowerCase().includes(searchQuery)) return;
    html += `
      <div class="info-card">
        <button class="delete-btn" onclick="deleteItem('pet', '${p.id}')">✕</button>
        <h3>🐾 ${p.name}</h3>
        <div class="meta" style="font-size:0.78rem;">${p.meta || ''} • Dueño: ${p.owner || ''}</div>
        <p style="font-size:0.85rem;">${p.desc || "Sin notas."}</p>
        <div class="card-actions-bottom">
          <button class="mini-btn" onclick="openPetModal(null, '${p.id}')">Editar Mascota</button>
        </div>
      </div>
    `;
  });

  if (!html) html = `<div class="empty-state">No hay mascotas registradas.</div>`;
  mascotasGrid.innerHTML = html;
}

function updateStats() {
  document.getElementById('statSims').innerText = simsData.length;
  document.getElementById('statLore').innerText = simsData.filter(s => s.lore && s.lore.trim() !== "").length + extraLore.length;
  document.getElementById('statHouses').innerText = housesData.length;
  document.getElementById('statPets').innerText = petsData.length;
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

document.addEventListener('DOMContentLoaded', loadAllData);
