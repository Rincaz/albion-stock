import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const $ = (s) => document.querySelector(s);
const IMG = (id, size = 64) =>
  `https://render.albiononline.com/v1/item/${encodeURIComponent(id)}.png?size=${size}`;
const STATUS_LABEL = { ok: "En stock", low: "Stock bajo", out: "Agotado" };
const LS_GUILD = "albion-stock:guild";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let catalog = [];            // [id, nombre ES, forma de encantamiento (0 no, 1 id@n, 2 id_LEVELn@n), nombre EN]
const nameMap = new Map();   // base id -> nombre en español
const enMap = new Map();     // base id -> nombre en inglés (para buscar)
const LS_EQUIV = "albion-stock:equiv";
let useEquiv = true;         // contar equivalentes (6.3 = 7.2 = 8.1)
let defaultMin = 8;          // faltante si hay menos de N unidades (items sin mínimo propio); compartido por el gremio
const nameIndex = new Map(); // nombre normalizado (ES/EN) -> Map(id -> forma)
let pendingWipe = null;      // solicitud de borrado total pendiente
let uploads = [];            // historial de subidas
let wipes = [];              // historial de solicitudes de borrado
let currentUid = null;
let memberships = [];        // [{ guild_id, role, display_name, guilds: {id, name, invite_code} }]
let guild = null;            // membresía activa
let stockRows = [];          // filas de public.stock
let minMap = new Map();      // item_id -> min_qty
let picked = null;           // { base, name, enchantable }

// ---------- Utilidades ----------
function esc(v) {
  const d = document.createElement("div");
  d.textContent = String(v ?? "");
  return d.innerHTML;
}
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

// Búsqueda sin tildes ni mayúsculas
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const EQUIP_RE = /^T\d_(MAIN|2H|OFF|HEAD|ARMOR|SHOES|BAG|CAPE)(_|@|$)/;
/**
 * Clave de equivalencia de equipo: mismo tipo de item y misma suma tier + encantamiento
 * (T6.3 = T7.2 = T8.1 → suma 9). Devuelve null si el item no es equipo (pociones, recursos, etc.).
 */
function equivKey(id) {
  if (!EQUIP_RE.test(id)) return null;
  const [base, ench] = id.split("@");
  const m = base.match(/^T(\d)_(.+)$/);
  return m ? `${m[2]}|${Number(m[1]) + Number(ench || 0)}` : null;
}

/** Separa un id en base y encantamiento; los recursos encantados usan T4_PLANKS_LEVEL1@1 (base T4_PLANKS). */
function splitId(id) {
  const [raw, ench] = id.split("@");
  return { base: raw.replace(/_LEVEL\d$/, ""), ench: Number(ench || 0) };
}
function itemName(id) {
  const { base, ench } = splitId(id);
  const n = nameMap.get(base) || base;
  return ench ? `${n} .${ench}` : n;
}
function tierOf(id) {
  const m = id.match(/^T(\d)_/);
  const ench = id.includes("@") ? "." + id.split("@")[1] : "";
  return (m ? `T${m[1]}` : "") + ench;
}
const img = (id) =>
  `<img class="item-img" src="${IMG(id)}" alt="" loading="lazy" width="40" height="40" onerror="this.style.visibility='hidden'">`;
const canEdit = () => guild && (guild.role === "admin" || guild.role === "editor");

async function fetchAll(table, build) {
  const out = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await build(supabase.from(table)).range(from, from + size - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

// ---------- Arranque y sesión ----------
async function init() {
  try {
    catalog = await (await fetch("items.json")).json();
    catalog.forEach(([id, es, form, en]) => {
      nameMap.set(id, es);
      enMap.set(id, en || es);
      for (const n of [es, en]) {
        const k = norm(n);
        if (!k) continue;
        if (!nameIndex.has(k)) nameIndex.set(k, new Map());
        nameIndex.get(k).set(id, form);
      }
    });
  } catch (err) {
    console.error("No se pudo cargar el catálogo de items:", err);
  }
  useEquiv = lsGet(LS_EQUIV) !== "0";
  $("#eqInv").checked = $("#eqDash").checked = useEquiv;
  // setTimeout evita llamar a supabase dentro del callback (riesgo de bloqueo en supabase-js)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    setTimeout(() => enter(session), 0);
  });
}

function show(view) {
  ["viewLogin", "viewSetup", "viewApp"].forEach((v) => ($(`#${v}`).hidden = v !== view));
}

function loginMessage(text, isError = true) {
  const box = isError ? $("#lError") : $("#lInfo");
  $("#lError").hidden = true;
  $("#lInfo").hidden = true;
  box.textContent = text;
  box.hidden = false;
}

let loadedUid = null; // usuario cuyo gremio ya se cargó con éxito
let entering = false; // evita cargas simultáneas (el login dispara varios eventos)

/** Punto único de entrada: decide qué vista mostrar según la sesión. Nunca deja la pantalla en silencio. */
async function enter(session) {
  const uid = session?.user?.id ?? null;
  currentUid = uid;
  if (!uid) {
    loadedUid = null; guild = null; memberships = [];
    return show("viewLogin");
  }
  if (entering) return;
  if (loadedUid === uid && (!$("#viewApp").hidden || !$("#viewSetup").hidden)) return; // ya cargado
  entering = true;
  try {
    await loadMemberships(uid);
    loadedUid = uid;
  } catch (err) {
    console.error("No se pudo cargar el gremio:", err);
    loadedUid = null;
    show("viewLogin");
    loginMessage("Sesión iniciada, pero no se pudo cargar tu gremio: " + (err.message || err));
  } finally {
    entering = false;
  }
}

async function loadMemberships(uid) {
  const { data, error } = await supabase
    .from("guild_members")
    .select("guild_id, role, display_name, guilds(id, name, invite_code)")
    .eq("user_id", uid);
  if (error) throw error;
  memberships = data.filter((m) => m.guilds);
  if (!memberships.length) return show("viewSetup");
  const saved = lsGet(LS_GUILD);
  guild = memberships.find((m) => m.guild_id === saved) || memberships[0];
  renderHeader();
  show("viewApp");
  refreshAll();
}

function renderHeader() {
  $("#guildSelect").innerHTML = memberships
    .map((m) => `<option value="${esc(m.guild_id)}" ${m.guild_id === guild.guild_id ? "selected" : ""}>${esc(m.guilds.name)}</option>`)
    .join("");
  $("#roleChip").textContent = { admin: "Admin", editor: "Editor", viewer: "Solo lectura" }[guild.role] || guild.role;
  const inv = $("#inviteChip");
  inv.hidden = guild.role !== "admin";
  inv.textContent = `Código: ${guild.guilds.invite_code}`;
  $("#btnMove").hidden = !canEdit();
  $("#uploadCard").hidden = !canEdit();
  $("#btnWipe").hidden = !canEdit();
}

$("#guildSelect").addEventListener("change", (e) => {
  guild = memberships.find((m) => m.guild_id === e.target.value) || guild;
  lsSet(LS_GUILD, guild.guild_id);
  renderHeader();
  refreshAll();
});

// ---------- Auth ----------
let authMode = "login";
document.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
  authMode = b.dataset.mode;
  document.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
  $("#lSubmit").textContent = authMode === "login" ? "Entrar" : "Crear cuenta";
  $("#lPass").autocomplete = authMode === "login" ? "current-password" : "new-password";
  $("#lError").hidden = true; $("#lInfo").hidden = true;
}));

$("#formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#lSubmit");
  if (btn.disabled) return; // evita doble envío
  btn.disabled = true;
  $("#lError").hidden = true; $("#lInfo").hidden = true;
  try {
    const creds = { email: $("#lEmail").value.trim(), password: $("#lPass").value };
    const { data, error } = authMode === "login"
      ? await supabase.auth.signInWithPassword(creds)
      : await supabase.auth.signUp(creds);
    if (error) {
      console.error(error);
      loginMessage(authMode === "login" ? "Credenciales inválidas o correo sin confirmar." : error.message);
    } else if (data.session) {
      await enter(data.session); // no depender solo del evento de auth
    } else {
      loginMessage("Cuenta creada. Confirma tu correo y luego entra.", false);
    }
  } catch (err) {
    console.error(err);
    loginMessage("Error inesperado: " + (err.message || err));
  } finally {
    btn.disabled = false;
  }
});

const logout = () => supabase.auth.signOut();
$("#btnLogout").addEventListener("click", logout);
$("#btnLogoutSetup").addEventListener("click", logout);

// ---------- Crear / unirse a gremio ----------
async function setupAction(call, errBox = $("#sError")) {
  errBox.hidden = true;
  const { error } = await call();
  if (error) {
    console.error(error);
    errBox.textContent = error.message;
    errBox.hidden = false;
    return;
  }
  try {
    await loadMemberships(currentUid);
    loadedUid = currentUid;
  } catch (e) {
    console.error(e);
    errBox.textContent = e.message || String(e);
    errBox.hidden = false;
  }
}
$("#formCreateGuild").addEventListener("submit", (e) => {
  e.preventDefault();
  setupAction(() => supabase.rpc("create_guild", { p_name: $("#gName").value.trim(), p_display: $("#gDisplay").value.trim() }));
});
$("#formJoinGuild").addEventListener("submit", (e) => {
  e.preventDefault();
  setupAction(() => supabase.rpc("join_guild", { p_code: $("#jCode").value.trim(), p_display: $("#jDisplay").value.trim() }));
});

// ---------- Datos ----------
async function refreshAll() {
  try {
    const gid = guild.guild_id;
    const [stock, mins, settings, wipeRows, upRows] = await Promise.all([
      fetchAll("stock", (q) => q.select("item_id, place, qty").eq("guild_id", gid).order("item_id").order("place")),
      fetchAll("stock_min", (q) => q.select("item_id, min_qty").eq("guild_id", gid).order("item_id")),
      supabase.from("stock_settings").select("default_min").eq("guild_id", gid).maybeSingle(),
      supabase.from("stock_wipe_requests").select("*").eq("guild_id", gid).order("requested_at", { ascending: false }).limit(10),
      supabase.from("stock_uploads").select("*").eq("guild_id", gid).order("created_at", { ascending: false }).limit(50),
    ]);
    for (const r of [settings, wipeRows, upRows]) if (r.error) throw r.error;
    stockRows = stock;
    minMap = new Map(mins.map((m) => [m.item_id, m.min_qty]));
    defaultMin = settings.data ? settings.data.default_min : 8;
    wipes = wipeRows.data;
    pendingWipe = wipes.find((w) => w.status === "pending") || null;
    uploads = upRows.data;
  } catch (err) {
    console.error("Error cargando stock:", err);
    return alert("No se pudo cargar el stock: " + err.message);
  }
  $("#defMin").value = defaultMin;
  $("#defMin").disabled = guild.role !== "admin";
  renderStock();
  renderDashboard();
  renderSubidas();
  renderWipeBanner();
  loadMoves();
}

/** Agrega el stock por item (suma de ubicaciones) e incluye items con mínimo pero sin existencias. */
function aggregate() {
  const map = new Map();
  for (const r of stockRows) {
    const e = map.get(r.item_id) || { item_id: r.item_id, total: 0, places: [] };
    e.total += r.qty;
    e.places.push({ place: r.place, qty: r.qty });
    map.set(r.item_id, e);
  }
  for (const id of minMap.keys()) if (!map.has(id)) map.set(id, { item_id: id, total: 0, places: [] });
  const entries = [...map.values()].map((e) => ({
    ...e,
    // Mínimo propio si existe (0 = sin mínimo); si no, el mínimo por defecto
    min: minMap.has(e.item_id) ? minMap.get(e.item_id) : defaultMin,
    minOwn: minMap.has(e.item_id),
    name: itemName(e.item_id), key: equivKey(e.item_id),
  }));

  // Equivalencias: stock efectivo = suma de todos los items equivalentes (mismo tipo y misma suma tier + encanto)
  groupTotals = new Map();
  for (const e of entries) if (e.key) groupTotals.set(e.key, (groupTotals.get(e.key) || 0) + e.total);
  for (const e of entries) {
    e.eff = useEquiv && e.key ? groupTotals.get(e.key) : e.total;
    e.others = useEquiv && e.key
      ? entries.filter((o) => o !== e && o.key === e.key && o.total > 0)
      : [];
  }
  return entries;
}
let groupTotals = new Map();
/** Stock efectivo de un item que quizá no está en el inventario (solo cuenta equivalentes). */
const effOf = (id) => {
  const k = equivKey(id);
  return useEquiv && k ? groupTotals.get(k) || 0 : 0;
};
const statusOf = (e) => (e.eff <= 0 ? "out" : e.min > 0 && e.eff < e.min ? "low" : "ok");

async function loadMoves() {
  const { data, error } = await supabase
    .from("movements").select("ts, player, item_id, qty, place")
    .eq("guild_id", guild.guild_id).order("created_at", { ascending: false }).limit(200);
  if (error) return console.error("movements:", error);
  $("#tbodyMoves").innerHTML = data.map((m) => `<tr>
    <td>${esc(m.ts)}</td><td>${img(m.item_id)}</td><td>${esc(itemName(m.item_id))}</td>
    <td>${esc(m.player)}</td>
    <td class="num ${m.qty > 0 ? "mv-in" : "mv-out"}">${m.qty > 0 ? "+" : "−"}${Math.abs(m.qty)}</td>
    <td>${esc(m.place)}</td></tr>`).join("");
  $("#emptyMoves").hidden = data.length > 0;
}

// ---------- Inventario ----------
function renderStock() {
  const q = norm($("#search").value.trim());
  const st = $("#filterStatus").value;
  const rows = aggregate()
    .filter((e) => !q || norm(e.name).includes(q) || norm(enMap.get(splitId(e.item_id).base)).includes(q) || norm(e.item_id).includes(q))
    .filter((e) => !st || statusOf(e) === st)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  $("#tbodyStock").innerHTML = rows.map((e) => {
    const k = statusOf(e);
    const placesTxt = e.places.some((p) => p.place) ? e.places.map((p) => `${p.place || "—"}: ${p.qty}`).join(" · ") : "";
    const equivTxt = e.others.length ? "≈ " + e.others.map((o) => `${tierOf(o.item_id)} ×${o.total}`).join(" · ") : "";
    return `<tr>
      <td>${img(e.item_id)}</td>
      <td>${esc(e.name)}</td>
      <td><span class="tier">${esc(tierOf(e.item_id))}</span></td>
      <td class="num"><strong>${e.total}</strong>${e.eff !== e.total ? `<span class="places">equiv. ${e.eff}</span>` : ""}</td>
      <td class="num" ${e.minOwn ? "" : `title="Mínimo por defecto"`}>${e.min}${e.minOwn ? "" : "*"}</td>
      <td><span class="badge ${k}">${STATUS_LABEL[k]}</span></td>
      <td><span class="places">${esc(placesTxt)}</span>${equivTxt ? `<span class="places">${esc(equivTxt)}</span>` : ""}</td>
      <td class="actions">${canEdit() ? `<button class="btn sm" data-id="${esc(e.item_id)}">Mover</button>` : ""}</td></tr>`;
  }).join("");
  $("#emptyStock").hidden = rows.length > 0;
  $("#placeList").innerHTML = [...new Set(stockRows.map((r) => r.place).filter(Boolean))]
    .map((p) => `<option value="${esc(p)}">`).join("");
}
$("#search").addEventListener("input", renderStock);
$("#filterStatus").addEventListener("input", renderStock);
$("#tbodyStock").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const entry = aggregate().find((x) => x.item_id === btn.dataset.id);
  if (entry) openMoveDialog(entry);
});

// ---------- Dashboard ----------
async function renderDashboard() {
  const items = aggregate();
  const units = items.reduce((a, e) => a + e.total, 0);
  const low = items.filter((e) => statusOf(e) === "low").length;
  const out = items.filter((e) => statusOf(e) === "out").length;
  $("#kpis").innerHTML = `
    <div class="kpi"><span>Items distintos</span><strong>${items.length}</strong></div>
    <div class="kpi"><span>Unidades en cofre</span><strong>${units.toLocaleString("es-CL")}</strong></div>
    <div class="kpi ${low ? "warn" : ""}"><span>Stock bajo</span><strong>${low}</strong></div>
    <div class="kpi ${out ? "danger" : ""}"><span>Agotados</span><strong>${out}</strong></div>`;

  const days = parseInt($("#period").value, 10);
  const { data, error } = await supabase.rpc("top_used", { p_guild: guild.guild_id, p_days: days, p_limit: 10 });
  if (error) console.error("top_used:", error);
  const used = data || [];
  const byId = new Map(items.map((e) => [e.item_id, e]));
  const maxUsed = Math.max(1, ...used.map((u) => Number(u.used)));

  $("#topUsed").innerHTML = used.length
    ? used.map((u) => {
        const have = byId.get(u.item_id)?.eff ?? effOf(u.item_id);
        const perDay = Number(u.used) / days;
        const cover = perDay > 0 ? Math.floor(have / perDay) : null;
        return `<div class="bar-row">${img(u.item_id)}<div class="bar-info">
          <div class="bar-top"><span>${esc(itemName(u.item_id))}</span><span>${u.used} usados</span></div>
          <div class="bar ${cover !== null && cover < 7 ? "red" : ""}"><i style="width:${(Number(u.used) / maxUsed) * 100}%"></i></div>
          <div class="bar-sub">Stock: ${have} · cobertura ≈ ${cover === null ? "—" : cover + " días"}</div>
        </div></div>`;
      }).join("")
    : '<p class="empty">Sin salidas registradas en este período.</p>';

  // Faltantes: bajo el mínimo, o agotados con uso reciente aunque no tengan mínimo definido
  const usedMap = new Map(used.map((u) => [u.item_id, Number(u.used)]));
  const lacking = items
    .map((e) => {
      const deficit = e.min > 0 ? Math.max(e.min - e.eff, 0) : 0;
      const recent = usedMap.get(e.item_id) || 0;
      return { ...e, deficit, recent, score: deficit || (e.eff === 0 ? recent : 0) };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
  // Items usados y agotados que ni siquiera aparecen en el inventario
  for (const u of used) {
    if (!byId.has(u.item_id) && effOf(u.item_id) === 0 && !lacking.some((l) => l.item_id === u.item_id)) {
      lacking.push({ item_id: u.item_id, name: itemName(u.item_id), total: 0, eff: 0, min: 0, deficit: 0, recent: Number(u.used), score: Number(u.used) });
    }
  }
  const maxScore = Math.max(1, ...lacking.map((l) => l.score));
  const LACK_PAGE = 15;
  const shown = lackingExpanded ? lacking : lacking.slice(0, LACK_PAGE);
  $("#lacking").innerHTML = lacking.length
    ? shown.map((l) => `<div class="bar-row">${img(l.item_id)}<div class="bar-info">
        <div class="bar-top"><span>${esc(l.name)}</span><span>${l.eff}${l.min ? " / " + l.min : ""}</span></div>
        <div class="bar red"><i style="width:${(l.score / maxScore) * 100}%"></i></div>
        <div class="bar-sub">${l.deficit ? "Faltan " + l.deficit : "Agotado · se usaron " + l.recent + " en " + days + " días"}</div>
      </div></div>`).join("") +
      (lacking.length > LACK_PAGE
        ? `<button type="button" class="btn" id="lackMore">${lackingExpanded ? "Ver menos" : `Ver todos (${lacking.length})`}</button>`
        : "")
    : '<p class="empty">Nada falta 🎉</p>';
}
let lackingExpanded = false;
$("#lacking").addEventListener("click", (e) => {
  if (!e.target.closest("#lackMore")) return;
  lackingExpanded = !lackingExpanded;
  renderDashboard();
});
$("#period").addEventListener("change", renderDashboard);

// Mínimo por defecto compartido por todo el gremio (solo un admin puede cambiarlo)
$("#defMin").addEventListener("change", async (e) => {
  const v = Math.max(0, Math.min(99999, parseInt(e.target.value, 10) || 0));
  if (guild.role !== "admin") { e.target.value = defaultMin; return; }
  const { error } = await supabase.from("stock_settings").upsert(
    { guild_id: guild.guild_id, default_min: v, updated_at: new Date().toISOString(), updated_by: currentUid },
    { onConflict: "guild_id" });
  if (error) {
    console.error(error);
    e.target.value = defaultMin;
    return alert("No se pudo guardar el ajuste: " + error.message);
  }
  defaultMin = v;
  e.target.value = v;
  renderStock();
  renderDashboard();
});

// Contar equivalentes (6.3 = 7.2 = 8.1): un solo estado, dos casillas sincronizadas
function setEquiv(value) {
  useEquiv = value;
  lsSet(LS_EQUIV, value ? "1" : "0");
  $("#eqInv").checked = $("#eqDash").checked = value;
  if (guild) { renderStock(); renderDashboard(); }
}
$("#eqInv").addEventListener("change", (e) => setEquiv(e.target.checked));
$("#eqDash").addEventListener("change", (e) => setEquiv(e.target.checked));

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
  ["dashboard", "inventario", "subidas", "movimientos"].forEach((n) => ($(`#tab-${n}`).hidden = n !== tab.dataset.tab));
}));

// ---------- Diálogo de movimiento ----------
function setPicked(base, name, form, enchant = 0) {
  picked = { base, name, form };
  $("#pickedBox").hidden = false;
  $("#pickResults").hidden = true;
  $("#pickedName").textContent = name;
  $("#enchantWrap").hidden = !form;
  $("#mEnchant").value = String(enchant);
  updatePickedImg();
}
function currentItemId() {
  const e = picked.form ? parseInt($("#mEnchant").value, 10) : 0;
  if (e <= 0) return picked.base;
  return picked.form === 2 ? `${picked.base}_LEVEL${e}@${e}` : `${picked.base}@${e}`;
}
function updatePickedImg() {
  const id = currentItemId();
  $("#pickedImg").src = IMG(id);
  $("#pickedId").textContent = `${tierOf(id)} · ${id}`;
}
$("#mEnchant").addEventListener("change", updatePickedImg);

$("#pickSearch").addEventListener("input", () => {
  const q = norm($("#pickSearch").value.trim());
  const list = $("#pickResults");
  if (q.length < 2) return (list.hidden = true);
  const found = catalog
    .filter(([id, es, , en]) => norm(es).includes(q) || norm(en).includes(q) || norm(id).includes(q))
    .slice(0, 30);
  list._found = found;
  list.innerHTML = found.map(([id, es, , en], i) =>
    `<li tabindex="0" data-i="${i}">${img(id)}<div>${esc(es)}<small>${esc(en)} · ${esc(id)}</small></div></li>`).join("");
  list.hidden = found.length === 0;
});
$("#pickResults").addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  const [id, name, form] = $("#pickResults")._found[Number(li.dataset.i)];
  setPicked(id, name, form);
});

function openMoveDialog(entry) {
  $("#formMove").reset();
  $("#mError").hidden = true;
  picked = null;
  $("#pickedBox").hidden = true;
  $("#pickResults").hidden = true;
  if (entry) {
    const { base, ench } = splitId(entry.item_id);
    const cat = catalog.find((c) => c[0] === base);
    const form = cat?.[2] || (ench ? (entry.item_id.includes("_LEVEL") ? 2 : 1) : 0);
    setPicked(base, nameMap.get(base) || base, form, ench);
    $("#pickSearch").value = entry.name;
    $("#mMin").value = entry.minOwn ? entry.min : "";
    $("#mPlace").value = entry.places[0]?.place || "";
  }
  $("#dlgMove").showModal();
}
$("#btnMove").addEventListener("click", () => openMoveDialog(null));
$("#btnCancel").addEventListener("click", () => $("#dlgMove").close());

$("#formMove").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#mError");
  const fail = (m) => { err.textContent = m; err.hidden = false; };
  err.hidden = true;
  if (!picked) return fail("Selecciona un item de la lista.");
  const qty = parseInt($("#mQty").value, 10);
  const type = $("#mType").value;
  if (!Number.isInteger(qty) || qty < 0 || (type !== "adjust" && qty === 0)) return fail("Cantidad inválida.");
  const minRaw = $("#mMin").value;

  const btn = $("#btnSubmitMove");
  btn.disabled = true;
  const itemId = currentItemId();
  const { error } = await supabase.rpc("stock_move", {
    p_guild: guild.guild_id, p_item: itemId, p_place: $("#mPlace").value.trim(), p_type: type, p_qty: qty,
  });
  let minError = null;
  if (!error && minRaw !== "") {
    ({ error: minError } = await supabase.from("stock_min").upsert(
      { guild_id: guild.guild_id, item_id: itemId, min_qty: Math.max(0, parseInt(minRaw, 10) || 0), updated_at: new Date().toISOString() },
      { onConflict: "guild_id,item_id" }));
  }
  btn.disabled = false;
  if (error || minError) {
    console.error(error || minError);
    return fail((error || minError).message);
  }
  $("#dlgMove").close();
  refreshAll();
});

// ---------- Subir el log del cofre ----------
const LS_PLACE = "albion-stock:place";
const dtFmt = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "medium" });

/** "10/29/2026 17:24:26" (M/D/AAAA) -> "2026-10-29 17:24:26". Mismo criterio que la web de regear. */
function isoDate(t) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})/.exec(t.trim());
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")} ${m[4].padStart(8, "0")}` : t.trim().slice(0, 19);
}

/** Cada línea del log: Fecha, Jugador, Objeto, Encantamiento, Calidad, Cantidad (entre comillas o separadas por tabulación). */
function parseLog(text) {
  const out = { rows: [], bad: 0 };
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    let f = line.match(/"([^"]*)"/g);
    f = f && f.length >= 6 ? f.map((x) => x.slice(1, -1)) : line.split("\t");
    if (f.length < 6) { out.bad++; return; }
    if (i === 0 && /fecha|date/i.test(f[0])) return; // encabezado
    const qty = parseInt(f[5], 10);
    const date = isoDate(f[0]);
    if (!qty || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) { out.bad++; return; }
    // La firma debe ser idéntica a la de la web de regear: así no se duplican líneas entre ambas
    out.rows.push({ sig: f.slice(0, 6).join("|"), date, player: f[1].trim(), obj: f[2], ench: f[3], qty });
  });
  return out;
}

/** Nombre del log (español o inglés) + encantamiento -> id de Albion. */
function resolveObject(obj, enchRaw) {
  const e = Math.min(4, Math.max(0, parseInt(enchRaw, 10) || 0));
  const hits = [...(nameIndex.get(norm(obj.trim())) || new Map()).entries()];
  if (!hits.length) return { error: "no reconocido" };
  if (hits.length > 1) return { error: `ambiguo (${hits.length} items con ese nombre)` };
  const [id, form] = hits[0];
  if (e === 0) return { id };
  if (form === 1) return { id: `${id}@${e}` };
  if (form === 2) return { id: `${id}_LEVEL${e}@${e}` };
  return { error: `no existe con encantamiento .${e}` };
}

async function runImport(dry) {
  const parsed = parseLog($("#lgText").value);
  const rows = [];
  const bad = new Map();
  let unrecognized = 0;
  for (const r of parsed.rows) {
    const res = resolveObject(r.obj, r.ench);
    if (res.error) {
      unrecognized++;
      const k = `${r.obj} (.${parseInt(r.ench, 10) || 0}) — ${res.error}`;
      bad.set(k, (bad.get(k) || 0) + Math.abs(r.qty));
      continue;
    }
    rows.push({ sig: r.sig, date: r.date, player: r.player, item: res.id, qty: r.qty });
  }
  if (!rows.length && !unrecognized && !parsed.bad) throw new Error("Pega primero el log del cofre.");
  const since = $("#lgSince").value ? $("#lgSince").value.replace("T", " ") + ":00" : null;
  const { data, error } = await supabase.rpc("stock_import_log", {
    p_guild: guild.guild_id, p_place: $("#lgPlace").value.trim(), p_rows: rows,
    p_since: since, p_unrecognized: unrecognized, p_dry_run: dry, p_force: $("#lgForce").checked,
  });
  if (error) throw error;
  return { plan: data, bad, badLines: parsed.bad, unrecognized };
}

function renderPlan({ plan, bad, badLines, unrecognized }, done) {
  const lastTo = uploads[0]?.log_to;
  let html = "";
  if (done) html += `<p class="lg-ok">✅ Subida registrada el ${esc(dtFmt.format(new Date()))}: ${plan.applied} líneas nuevas aplicadas.</p>`;
  else if (plan.lines && !plan.applied) html += '<p class="lg-bad">No hay líneas nuevas: todo este registro figura como ya subido (por esta web o por regear). Si borraste el stock y quieres cargarlo otra vez, marca «Volver a cargar líneas ya subidas» y previsualiza de nuevo.</p>';
  else if (!plan.lines) html += '<p class="lg-bad">No se leyó ninguna línea válida. Revisa que pegaste el log con sus 6 columnas.</p>';
  if (!done && plan.applied && lastTo && plan.to < lastTo) {
    html += `<p class="lg-bad">Ojo: el log termina antes de la última subida (${esc(lastTo)}). Revisa que no sea otro registro.</p>`;
  }
  html += `<p class="lg-sum"><b>${plan.lines}</b> líneas leídas · <b>${plan.skipped}</b> ya subidas antes · <b>${plan.before}</b> anteriores a «Desde» · <b>${plan.applied}</b> nuevas` +
    ` · <b>${plan.items_count}</b> items con movimiento neto (+${plan.units_in} / −${plan.units_out})` +
    `${unrecognized ? ` · <b>${unrecognized}</b> sin reconocer` : ""}${badLines ? ` · ${badLines} ilegibles` : ""}</p>`;
  if (plan.items.length) {
    html += '<ul class="lg-list">' + plan.items.slice(0, 300).map((it) =>
      `<li>${img(it.item)}<span class="lg-n ${it.net > 0 ? "up" : "down"}">${it.net > 0 ? "+" : ""}${it.net}</span> ${esc(itemName(it.item))} <span class="tier">${esc(tierOf(it.item))}</span>` +
      `${it.net < 0 && it.have + it.net < 0 ? ' <span class="miss">retira más de lo que hay en stock</span>' : ""}</li>`).join("") + "</ul>";
    if (plan.items.length > 300) html += `<p class="hint">…y ${plan.items.length - 300} items más.</p>`;
  }
  if (bad.size) {
    html += '<p class="lg-bad">Sin reconocer (no se cargan):</p><ul class="lg-list">' +
      [...bad.entries()].map(([k, n]) => `<li>${esc(k)} · ${n}</li>`).join("") + "</ul>";
  }
  $("#lgOut").innerHTML = html;
}

async function importAction(dry) {
  const btnP = $("#lgPreview"), btnA = $("#lgApply");
  btnP.disabled = btnA.disabled = true;
  try {
    const result = await runImport(dry);
    renderPlan(result, !dry);
    if (dry) {
      btnA.disabled = !(result.plan.applied > 0);
      $("#lgApplyHint").hidden = !btnA.disabled;
    }
    else {
      lsSet(LS_PLACE, $("#lgPlace").value.trim());
      $("#lgText").value = "";
      await refreshAll();
    }
  } catch (err) {
    console.error(err);
    $("#lgOut").innerHTML = `<p class="form-error">${esc(err.message || err)}</p>`;
  } finally {
    btnP.disabled = false;
    if (dry === false) btnA.disabled = true;
  }
}
$("#lgPreview").addEventListener("click", () => importAction(true));
$("#lgApply").addEventListener("click", () => {
  if (confirm("¿Aplicar este log al stock del gremio? Quedará registrado con día y hora.")) importAction(false);
});
const lockApply = () => { $("#lgApply").disabled = true; $("#lgApplyHint").hidden = false; };
$("#lgText").addEventListener("input", lockApply);
$("#lgForce").addEventListener("change", lockApply);
$("#lgPlace").addEventListener("input", lockApply);
$("#lgSince").addEventListener("change", lockApply);
$("#lgFile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  $("#lgText").value = await f.text();
  importAction(true);
});

// ---------- Registro de subidas y borrados ----------
function renderSubidas() {
  if (!$("#lgPlace").value) $("#lgPlace").value = lsGet(LS_PLACE) || "";
  $("#tbodyUploads").innerHTML = uploads.map((u) => `<tr>
    <td>${esc(dtFmt.format(new Date(u.created_at)))}</td>
    <td>${esc(u.user_name || "—")}</td>
    <td>${esc(u.log_from || "?")} → ${esc(u.log_to || "?")}</td>
    <td>${esc(u.place || "—")}</td>
    <td class="num">${u.applied}</td><td class="num">${u.skipped}</td><td class="num">${u.unrecognized}</td>
    <td class="num">${u.items}</td>
    <td class="num mv-in">+${u.units_in}</td><td class="num mv-out">−${u.units_out}</td></tr>`).join("");
  $("#emptyUploads").hidden = uploads.length > 0;
  const label = { pending: "Pendiente", approved: "Confirmado", rejected: "Rechazado" };
  $("#wipeList").innerHTML = wipes.length
    ? wipes.map((w) => `<li>${esc(dtFmt.format(new Date(w.requested_at)))} · pedido por ${esc(w.requested_name)} · <b>${label[w.status]}</b>` +
        `${w.resolved_at ? ` por ${esc(w.resolved_name)} (${esc(dtFmt.format(new Date(w.resolved_at)))})` : ""}` +
        `${w.status === "approved" ? ` · ${w.items_count} items, ${w.units_count} uds.` : ""}</li>`).join("")
    : '<li class="hint">Sin solicitudes de borrado.</li>';
}

// ---------- Borrado total con confirmación de un admin ----------
function renderWipeBanner() {
  const box = $("#wipeBanner");
  $("#btnWipe").disabled = Boolean(pendingWipe);
  if (!pendingWipe) { box.hidden = true; return; }
  const isAdmin = guild.role === "admin";
  box.hidden = false;
  box.innerHTML = `<div><strong>⚠️ Solicitud de borrado total del stock</strong><br><small>Pedida por ${esc(pendingWipe.requested_name)} el ` +
    `${esc(dtFmt.format(new Date(pendingWipe.requested_at)))}. ${isAdmin ? "Como admin puedes confirmarla o rechazarla." : "Falta la confirmación de un admin."}</small></div>` +
    (isAdmin ? '<div class="wipe-actions"><button class="btn danger" id="btnWipeOk">Confirmar borrado</button><button class="btn" id="btnWipeNo">Rechazar</button></div>' : "");
}
$("#wipeBanner").addEventListener("click", async (e) => {
  const ok = e.target.closest("#btnWipeOk");
  const no = e.target.closest("#btnWipeNo");
  if ((!ok && !no) || !pendingWipe) return;
  if (ok && !confirm("Esto elimina TODO el stock del gremio (queda registrado en Movimientos). ¿Confirmas el borrado?")) return;
  const { error } = await supabase.rpc("stock_wipe_resolve", { p_request: pendingWipe.id, p_approve: Boolean(ok) });
  if (error) { console.error(error); return alert(error.message); }
  refreshAll();
});
$("#btnWipe").addEventListener("click", async () => {
  if (!confirm("Vas a solicitar borrar TODO el stock del gremio. No se borra nada hasta que un admin lo confirme. ¿Enviar la solicitud?")) return;
  const { error } = await supabase.rpc("stock_wipe_request", { p_guild: guild.guild_id });
  if (error) { console.error(error); return alert(error.message); }
  refreshAll();
});

init();
