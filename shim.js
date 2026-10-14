// Adattatore per l'uso fuori da Claude: salvataggio condiviso via /api/settimane e download normali del browser.
(function () {
  const listeners = new Set();
  let cache = [];
  async function load() {
    const r = await fetch('/api/settimane', { cache: 'no-store' });
    if (!r.ok) throw new Error('api');
    cache = await r.json();
    const snap = { docs: cache.map(d => ({ id: d.id, data: () => d })) };
    listeners.forEach(fn => { try { fn(snap); } catch (e) {} });
  }
  function adminKey(force) {
    let k = null; try { k = localStorage.getItem('drc_adminKey'); } catch (e) {}
    if (!k || force) {
      k = window.prompt('Chiave per salvare (ADMIN_KEY impostata su Vercel):') || '';
      try { localStorage.setItem('drc_adminKey', k); } catch (e) {}
    }
    return k;
  }
  async function write(method, url, body) {
    for (let tryNo = 0; tryNo < 2; tryNo++) {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey(tryNo > 0) }, body: body ? JSON.stringify(body) : undefined });
      if (r.status === 401 && tryNo === 0) continue;
      if (r.status === 401) throw { code: 'permission_denied' };
      if (!r.ok) throw { code: 'unavailable' };
      await load();
      return;
    }
  }
  const db = {
    collection(name) {
      return {
        onSnapshot(next, onErr) {
          listeners.add(next);
          load().catch(e => onErr && onErr(e));
          const t = setInterval(() => load().catch(() => {}), 30000);
          return () => { listeners.delete(next); clearInterval(t); };
        },
        doc(id) {
          return {
            set: body => write('PUT', '/api/settimane', body),
            delete: () => write('DELETE', '/api/settimane?id=' + encodeURIComponent(id)),
          };
        },
      };
    },
  };
  const downloads = {
    async save({ filename, data }) {
      const type = filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = URL.createObjectURL(new Blob([data], { type }));
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return {};
    },
  };
  let dbReady = null;
  window.claude = {
    use: async name => {
      if (name === 'downloads') return downloads;
      if (name === 'db') {
        if (!dbReady) dbReady = fetch('/api/settimane', { cache: 'no-store' }).then(r => (r.ok ? db : null)).catch(() => null);
        return dbReady;
      }
      return null;
    },
  };
})();
