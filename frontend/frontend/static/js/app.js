/*
  app.js - Lógica compartida para login/registro y CRUD de computadores
  Usa API_BASE_URL definido en cada HTML (por defecto localhost:5000)
*/
(function(){
  // lee API_BASE_URL desde el scope global de cada HTML
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:5000';

  // helper: get auth headers si hay token
  function authHeaders(extra){
    const headers = Object.assign({}, extra || {});
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    const token = localStorage.getItem('access_token');
    if(token){ headers['Authorization'] = `Bearer ${token}`; }
    return headers;
  }

  // ---------- Login / Register (index.html) ----------
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    const message = document.getElementById('message');
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault(); message.textContent='';
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      try{
        const res = await fetch(`${API}/login`, { method:'POST', headers: authHeaders(), body: JSON.stringify({username,password}) });
        const data = await res.json();
        if(res.ok){
          message.textContent = 'Autenticación exitosa'; message.className='success';
          if(data.access_token){ localStorage.setItem('access_token', data.access_token); }
          // Redirigir al frontend estático de computadores
          window.location.href = 'computadores.html';
        } else { message.textContent = data.error || 'Error en la autenticación'; message.className='error'; }
      }catch(err){ message.textContent='Error de red. Inténtalo de nuevo.'; message.className='error'; }
    });

    const registerBtn = document.getElementById('registerBtn');
    registerBtn.addEventListener('click', async (e)=>{
      e.preventDefault(); message.textContent='';
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      if(!username || !password){ message.textContent='Usuario y contraseña son obligatorios.'; message.className='error'; return; }
      try{
        const res = await fetch(`${API}/registry`, { method:'POST', headers: authHeaders(), body: JSON.stringify({username,password}) });
        const data = await res.json();
        if(res.ok){
          message.textContent = 'Registro exitoso. Iniciando sesión...'; message.className='success';
          // intento login automático
          const loginRes = await fetch(`${API}/login`, { method:'POST', headers: authHeaders(), body: JSON.stringify({username,password}) });
          const loginData = await loginRes.json();
          if(loginRes.ok && loginData.access_token){
            localStorage.setItem('access_token', loginData.access_token);
            window.location.href = 'computadores.html';
          }
        } else { message.textContent = data.error || 'Error en el registro'; message.className='error'; }
      }catch(err){ message.textContent='Error de red al registrar. Intenta de nuevo.'; message.className='error'; }
    });
  }

  // ---------- Computadores CRUD (computadores.html) ----------
  const itemsTableBody = document.querySelector('#itemsTable tbody');
  const createForm = document.getElementById('createForm');
  const msgEl = document.getElementById('message');

  function escapeHtml(s){ return String(s||'').replace(/[&"'<>]/g, c=>({ '&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;" })[c]); }

  async function fetchItems(){
    try{
      const res = await fetch(`${API}/computadores`, { headers: authHeaders() });
      if(res.ok){ const data = await res.json(); renderItems(data); }
      else if(res.status===401){ handleUnauthorized(); }
      else { msgEl.textContent='Error cargando items'; }
    }catch(e){ msgEl.textContent='Error cargando items'; }
  }

  function renderItems(items){
    if(!items) items = [];
    itemsTableBody.innerHTML = '';
    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${it.id}</td>
          <td><input data-id="${it.id}" data-field="cpu" value="${escapeHtml(it.cpu)}"></td>
          <td><input data-id="${it.id}" data-field="ram" value="${escapeHtml(it.ram)}"></td>
          <td><input data-id="${it.id}" data-field="almacenamiento" value="${escapeHtml(it.almacenamiento)}"></td>
          <td><input data-id="${it.id}" data-field="gpu" value="${escapeHtml(it.gpu)}"></td>
          <td><input data-id="${it.id}" data-field="so" value="${escapeHtml(it.so)}"></td>
          <td class="row-actions">
            <button data-action="save" data-id="${it.id}" class="btn">Guardar</button>
            <button data-action="delete" data-id="${it.id}" class="btn ghost">Borrar</button>
          </td>
        `;
      itemsTableBody.appendChild(tr);
    });
  }

  if(createForm){
    createForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const payload = {
        cpu: document.getElementById('cpu').value,
        ram: Number(document.getElementById('ram').value),
        almacenamiento: document.getElementById('almacenamiento').value,
        gpu: document.getElementById('gpu').value,
        so: document.getElementById('so').value,
      };
      try{
        const res = await fetch(`${API}/computadores`, { method:'POST', headers: authHeaders(), body: JSON.stringify(payload)});
        if(res.status===201){ msgEl.textContent='Creado correctamente'; e.target.reset(); fetchItems(); }
        else if(res.status===401){ handleUnauthorized(); }
        else{ const d = await res.json(); msgEl.textContent = d.error || 'Error al crear'; }
      }catch(err){ msgEl.textContent='Error de red al crear'; }
    });

    // table events (save/delete)
    itemsTableBody && itemsTableBody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const id = btn.dataset.id; const action = btn.dataset.action;
      if(action==='delete'){
        if(!confirm('¿Eliminar este computador?')) return;
        const res = await fetch(`${API}/computadores/${id}`, { method:'DELETE', headers: authHeaders() });
        if(res.status===200){ msgEl.textContent='Eliminado'; fetchItems(); }
        else if(res.status===401){ handleUnauthorized(); }
        else{ msgEl.textContent='Error al eliminar'; }
        return;
      }
      if(action==='save'){
        const inputs = document.querySelectorAll(`input[data-id="${id}"]`);
        const body = {};
        inputs.forEach(i=>{ const f=i.dataset.field; body[f] = isNaN(i.value) ? i.value : Number(i.value); });
        const res = await fetch(`${API}/computadores/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(body) });
        if(res.status===200){ msgEl.textContent='Actualizado'; fetchItems(); }
        else if(res.status===401){ handleUnauthorized(); }
        else{ msgEl.textContent='Error al actualizar'; }
        return;
      }
    });

    document.getElementById('resetBtn').addEventListener('click', ()=>{ createForm.reset(); msgEl.textContent=''; });

    // logout
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){ logoutBtn.addEventListener('click', async ()=>{
      try{ await fetch(`${API}/logout`, { method:'POST', headers: authHeaders() }); }catch(e){}
      localStorage.removeItem('access_token');
      window.location.href = 'index.html';
    }); }

    // Inicializar lista
    fetchItems();
  }

  function handleUnauthorized(){
    localStorage.removeItem('access_token');
    window.location.href = 'index.html';
  }

})();
