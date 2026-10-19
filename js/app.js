// Configuración de conexión con tus claves reales de Supabase
const SUPABASE_URL = 'https://sdmlcxqlrywncxtezjsn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWxjeHFscnl3bmN4dGV6anNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0M1Y2NzEsImV4cCI6MjEwNzk4NzY3MX0.R-euYD3pKFw8OAN5DX65pLqORtM3co-YTDLN5KdQHPY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let simsData = [];

// Cargar la lista completa de Sims desde Supabase
async function cargarSims() {
  const { data, error } = await _supabase.from('sims').select('*').order('id', { ascending: true });
  
  if (error) {
    console.error('Error de lectura:', error);
    document.getElementById('simsContainer').innerHTML = '<p style="color: #f87171;">Error al conectar con la base de datos.</p>';
  } else {
    simsData = data || [];
    actualizarDesplegablePadres();
    renderSims();
  }
}

// Rellenar el desplegable para elegir padre/madre en el árbol genealógico
function actualizarDesplegablePadres() {
  const select = document.getElementById('parent_id');
  select.innerHTML = '<option value="">-- Ninguno (Fundador/a) --</option>';
  
  simsData.forEach(sim => {
    const option = document.createElement('option');
    option.value = sim.id;
    option.textContent = `${sim.name} (${sim.family || 'Sin familia'})`;
    select.appendChild(option);
  });
}

// Pintar las tarjetas de los Sims en pantalla
function renderSims() {
  const container = document.getElementById('simsContainer');
  
  if (simsData.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">Aún no hay Sims guardados. ¡Añade el primero arriba!</p>';
    return;
  }

  container.innerHTML = simsData.map(sim => {
    const progenitor = sim.parent_id ? simsData.find(s => s.id == sim.parent_id) : null;
    const nombrePadre = progenitor ? progenitor.name : null;

    return `
      <div class="sim-card">
        <img src="${sim.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}" alt="${sim.name}" onerror="this.src='https://via.placeholder.com/90?text=Sim'">
        <div class="sim-name">${sim.name}</div>
        <div class="sim-meta">${sim.family || 'Sin familia'} ${sim.generation ? '• ' + sim.generation : ''}</div>
        
        ${sim.traits ? `<div class="sim-badge">✨ ${sim.traits}</div>` : ''}
        ${nombrePadre ? `<div style="font-size: 0.75rem; color: var(--accent-lavender); margin-bottom: 4px;">🧬 Descendiente de: ${nombrePadre}</div>` : ''}
        
        ${sim.lore ? `<div class="sim-lore">📖 ${sim.lore}</div>` : ''}
        ${sim.extra_info ? `<div class="sim-extra">📌 <strong>Extra:</strong> ${sim.extra_info}</div>` : ''}
      </div>
    `;
  }).join('');
}

// Insertar un nuevo Sim en Supabase al enviar el formulario
async function saveSim(e) {
  e.preventDefault();

  const nuevoSim = {
    name: document.getElementById('name').value,
    image_url: document.getElementById('image_url').value || null,
    family: document.getElementById('family').value || null,
    parent_id: document.getElementById('parent_id').value || null,
    generation: document.getElementById('generation').value || null,
    traits: document.getElementById('traits').value || null,
    lore: document.getElementById('lore').value || null,
    extra_info: document.getElementById('extra_info').value || null
  };

  const { error } = await _supabase.from('sims').insert([nuevoSim]);

  if (error) {
    alert('Hubo un error al guardar en la nube: ' + error.message);
  } else {
    document.getElementById('simForm').reset();
    await cargarSims();
  }
}

// Event Listeners y arranque
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('simForm').addEventListener('submit', saveSim);
  cargarSims();
});