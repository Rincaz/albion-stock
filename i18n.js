// Idiomas: español (por defecto, es la "clave" de cada texto) e inglés.
// t("texto en español", { vars }) devuelve el texto en el idioma activo; {var} se reemplaza por vars.var.
// Los textos fijos del HTML se traducen recorriendo el DOM (ver applyStatic).

const LS_LANG = "albion-stock:lang";

const EN = {
  // ---- Página, login y gremio ----
  "Albion · Control de Stock": "Albion · Stock Control",
  "⚔️ Albion · Stock del gremio": "⚔️ Albion · Guild Stock",
  "Entrar": "Log in",
  "Crear cuenta": "Create account",
  "Usuario o correo": "Username or email",
  "Contraseña": "Password",
  "Crear un gremio": "Create a guild",
  "Nombre del gremio": "Guild name",
  "Tu nombre en el juego": "Your in-game name",
  "Crear": "Create",
  "Unirme con código de invitación": "Join with an invite code",
  "Código": "Code",
  "Unirme": "Join",
  "Salir": "Log out",
  "Gremio": "Guild",
  "+ Registrar movimiento": "+ Log movement",
  "Admin": "Admin",
  "Editor": "Editor",
  "Solo lectura": "Read-only",

  // ---- Pestañas ----
  "Dashboard": "Dashboard",
  "Inventario": "Inventory",
  "Subir log": "Upload log",
  "Movimientos": "Movements",
  "Excluidos": "Excluded",
  "Miembros": "Members",
  "Excluidos ({n})": "Excluded ({n})",

  // ---- Dashboard ----
  "Período de uso": "Usage period",
  "7 días": "7 days",
  "30 días": "30 days",
  "90 días": "90 days",
  "{n} días": "{n} days",
  "Contar equivalentes": "Count equivalents",
  "Mismo tipo de equipo y misma suma tier + encantamiento": "Same equipment type and same tier + enchantment sum",
  "Faltante si hay menos de…": "Short if fewer than…",
  "Elige un valor por tipo (compartido por el gremio, lo cambia un admin). Haz clic en un tipo para filtrar la lista.":
    "Pick a value per type (shared by the guild, changed by an admin). Click a type to filter the list.",
  "🔥 Más utilizados": "🔥 Most used",
  "Salidas del período · cobertura = días que dura el stock actual a ese ritmo":
    "Outflows in the period · coverage = days the current stock lasts at that rate",
  "⚠️ Faltantes": "⚠️ Shortages",
  "Bajo el mínimo, o agotados y con uso reciente": "Below the minimum, or out of stock with recent use",
  "Exportar para comprar (CSV)": "Export shopping list (CSV)",
  "Copiar lista": "Copy list",
  "¡Copiado!": "Copied!",
  "No se pudo copiar": "Could not copy",
  "Items distintos": "Distinct items",
  "Unidades en cofre": "Units in chest",
  "Stock bajo": "Low stock",
  "Agotados": "Out of stock",
  "{n} usados": "{n} used",
  "{n} equivalentes": "{n} equivalents",
  "Stock: {n} · cobertura ≈ {d}": "Stock: {n} · coverage ≈ {d}",
  "Sin salidas registradas en este período.": "No outflows recorded in this period.",
  "Faltan {n}": "Short by {n}",
  "Agotado · se usaron {n} en {d} días": "Out of stock · {n} used in {d} days",
  "Nada falta 🎉": "Nothing is short 🎉",
  "Nada falta en este tipo 🎉": "Nothing is short in this type 🎉",
  "Ver todos ({n})": "Show all ({n})",
  "Ver menos": "Show less",
  "Excluir del dashboard": "Exclude from dashboard",

  // ---- Tipos y mínimos por tipo ----
  "Arma": "Weapon",
  "Pecho": "Chest",
  "Casco": "Head",
  "Zapatos": "Shoes",
  "Capas": "Capes",
  "Otros": "Other",
  "Todos · general": "All · general",
  "menos de": "fewer than",
  "uds.": "units",
  "Mínimo {tipo}": "Minimum {tipo}",
  "usa el general": "uses the general value",
  "propio del tipo": "set for this type",
  "para tipos sin valor propio": "for types without their own value",
  "No se pudo guardar: ": "Could not save: ",

  // ---- Inventario ----
  "Buscar item…": "Search item…",
  "Todos": "All",
  "En stock": "In stock",
  "Agotado": "Out of stock",
  "Contar equivalentes (T6.3 = T7.2 = T8.1)": "Count equivalents (T6.3 = T7.2 = T8.1)",
  "Eliminar todo el stock…": "Delete all stock…",
  "Pide borrar todo el stock; un admin debe confirmarlo": "Requests deleting all stock; an admin must confirm it",
  "Item": "Item",
  "Tier": "Tier",
  "Stock": "Stock",
  "Mínimo": "Minimum",
  "Estado": "Status",
  "Ubicación": "Location",
  "Sin items. Registra una entrada para empezar.": "No items. Log an entry to get started.",
  "equiv.": "equiv.",
  "Mínimo por defecto": "Default minimum",
  "Mover": "Move",

  // ---- Subir log ----
  "Subir log del cofre": "Upload chest log",
  "En Albion abre el log del cofre del gremio, cópialo y pégalo aquí (o carga el archivo). Las líneas que ya se subieron se ignoran solas, también las subidas desde la web de regear.":
    "In Albion open the guild chest log, copy it and paste it here (or load the file). Lines that were already uploaded are skipped automatically, including those uploaded from the regear site.",
  "Log del cofre": "Chest log",
  "\"Fecha\"  \"Jugador\"  \"Objeto\"  \"Encantamiento\"  \"Calidad\"  \"Cantidad\"": "\"Date\"  \"Player\"  \"Item\"  \"Enchantment\"  \"Quality\"  \"Amount\"",
  "Archivo (opcional)": "File (optional)",
  "Ubicación del cofre": "Chest location",
  "Opcional": "Optional",
  "Solo desde (opcional)": "Only since (optional)",
  "Volver a cargar líneas ya subidas (úsalo después de borrar el stock)": "Reload lines that were already uploaded (use after deleting the stock)",
  "Previsualizar": "Preview",
  "Aplicar al stock": "Apply to stock",
  "Primero pulsa «Previsualizar»; «Aplicar» se habilita si hay líneas nuevas.": "First press “Preview”; “Apply” is enabled when there are new lines.",
  "Registro de subidas": "Upload history",
  "Cada vez que se sube stock queda anotado con día y hora.": "Every stock upload is recorded with its date and time.",
  "Día y hora": "Date and time",
  "Subido por": "Uploaded by",
  "Rango del log": "Log range",
  "Nuevas": "New",
  "Repetidas": "Repeated",
  "Sin reconocer": "Unrecognized",
  "Items": "Items",
  "Entradas": "In",
  "Salidas": "Out",
  "Aún no se ha subido ningún log.": "No log has been uploaded yet.",
  "Borrados totales del stock": "Full stock deletions",
  "Pega primero el log del cofre.": "Paste the chest log first.",
  "no reconocido": "not recognized",
  "ambiguo ({n} items con ese nombre)": "ambiguous ({n} items with that name)",
  "no existe con encantamiento .{e}": "does not exist with enchantment .{e}",
  "✅ Subida registrada el {fecha}: {n} líneas nuevas aplicadas.": "✅ Upload recorded on {fecha}: {n} new lines applied.",
  "No hay líneas nuevas: todo este registro figura como ya subido (por esta web o por regear). Si borraste el stock y quieres cargarlo otra vez, marca «Volver a cargar líneas ya subidas» y previsualiza de nuevo.":
    "No new lines: this whole log is already marked as uploaded (by this site or by regear). If you deleted the stock and want to load it again, tick “Reload lines that were already uploaded” and preview again.",
  "No se leyó ninguna línea válida. Revisa que pegaste el log con sus 6 columnas.": "No valid line was read. Check that you pasted the log with its 6 columns.",
  "Ojo: el log termina antes de la última subida ({fecha}). Revisa que no sea otro registro.": "Heads up: this log ends before the last upload ({fecha}). Check that it is not a different log.",
  "<b>{lines}</b> líneas leídas · <b>{skipped}</b> ya subidas antes · <b>{before}</b> anteriores a «Desde» · <b>{applied}</b> nuevas":
    "<b>{lines}</b> lines read · <b>{skipped}</b> already uploaded · <b>{before}</b> before “Since” · <b>{applied}</b> new",
  " · <b>{n}</b> items con movimiento neto (+{in} / −{out})": " · <b>{n}</b> items with net movement (+{in} / −{out})",
  " · <b>{n}</b> sin reconocer": " · <b>{n}</b> unrecognized",
  " · {n} ilegibles": " · {n} unreadable",
  "retira más de lo que hay en stock": "withdraws more than is in stock",
  "…y {n} items más.": "…and {n} more items.",
  "Sin reconocer (no se cargan):": "Unrecognized (not loaded):",
  "¿Aplicar este log al stock del gremio? Quedará registrado con día y hora.": "Apply this log to the guild stock? It will be recorded with date and time.",
  "Pendiente": "Pending",
  "Confirmado": "Confirmed",
  "Rechazado": "Rejected",
  "{fecha} · pedido por {quien} · ": "{fecha} · requested by {quien} · ",
  " por {quien} ({fecha})": " by {quien} ({fecha})",
  " · {n} items, {u} uds.": " · {n} items, {u} units",
  "Sin solicitudes de borrado.": "No deletion requests.",

  // ---- Borrado total ----
  "⚠️ Solicitud de borrado total del stock": "⚠️ Request to delete all stock",
  "Pedida por {quien} el {fecha}. ": "Requested by {quien} on {fecha}. ",
  "Como admin puedes confirmarla o rechazarla.": "As an admin you can confirm or reject it.",
  "Falta la confirmación de un admin.": "An admin still has to confirm.",
  "Confirmar borrado": "Confirm deletion",
  "Rechazar": "Reject",
  "Esto elimina TODO el stock del gremio (queda registrado en Movimientos). ¿Confirmas el borrado?":
    "This deletes ALL the guild stock (it is recorded in Movements). Confirm the deletion?",
  "Vas a solicitar borrar TODO el stock del gremio. No se borra nada hasta que un admin lo confirme. ¿Enviar la solicitud?":
    "You are about to request deleting ALL the guild stock. Nothing is deleted until an admin confirms it. Send the request?",

  // ---- Movimientos y diálogo ----
  "Fecha": "Date",
  "Jugador": "Player",
  "Cant.": "Qty.",
  "Aún no hay movimientos.": "There are no movements yet.",
  "Registrar movimiento": "Log movement",
  "Escribe el nombre (ej: broadsword, bag, potion)…": "Type the name (e.g. broadsword, bag, potion)…",
  "Encantamiento": "Enchantment",
  "Tipo": "Type",
  "Entrada (+)": "In (+)",
  "Salida (−)": "Out (−)",
  "Ajuste (fijar stock)": "Adjustment (set stock)",
  "Cantidad": "Quantity",
  "Stock mínimo": "Minimum stock",
  "sin cambio": "no change",
  "Ubicación (cofre / pestaña)": "Location (chest / tab)",
  "Cancelar": "Cancel",
  "Registrar": "Log",
  "Selecciona un item de la lista.": "Select an item from the list.",
  "Cantidad inválida.": "Invalid quantity.",

  // ---- Excluidos ----
  "Items excluidos de tu dashboard": "Items excluded from your dashboard",
  "Solo tú los dejas de ver (en «Más utilizados», «Faltantes» y los contadores). El stock no cambia. Con equivalencias activas, reintegrar uno reintegra todo su grupo.":
    "Only you stop seeing them (in “Most used”, “Shortages” and the counters). The stock does not change. With equivalents on, restoring one restores its whole group.",
  "No has excluido ningún item.": "You have not excluded any item.",
  "Reintegrar": "Restore",
  "No se pudo excluir: ": "Could not exclude: ",
  "No se pudo reintegrar: ": "Could not restore: ",

  // ---- Miembros ----
  "Crear cuenta con usuario y contraseña": "Create an account with username and password",
  "Para quien no tiene correo: le creas la cuenta aquí y entra con ese usuario. Pásale la contraseña por un medio privado.":
    "For someone without an email: create their account here and they log in with that username. Send them the password through a private channel.",
  "Usuario": "Username",
  "Nombre en el gremio": "Name in the guild",
  "Rol": "Role",
  "Editor (sube y mueve stock)": "Editor (uploads and moves stock)",
  "Agregar miembro": "Add member",
  "Si el correo ya tiene cuenta entra al gremio al instante. Si no, queda pendiente y se une solo cuando se registre e inicie sesión con ese correo.":
    "If the email already has an account they join the guild instantly. Otherwise it stays pending and they join on their own when they register and log in with that email.",
  "Ej: shankgos": "E.g. shankgos",
  "Agregar": "Add",
  "Miembros del gremio": "Guild members",
  "Nombre": "Name",
  "Correo": "Email",
  "Invitaciones pendientes": "Pending invitations",
  "Código de invitación": "Invite code",
  "Quien tenga el código puede unirse como solo lectura. Si se filtró, genera uno nuevo.": "Anyone with the code can join as read-only. If it leaked, generate a new one.",
  "Generar código nuevo": "Generate new code",
  "Sin nombre": "No name",
  "tú": "you",
  "Quitar": "Remove",
  "Sin invitaciones pendientes.": "No pending invitations.",
  "Agregado al gremio.": "Added to the guild.",
  "Invitación guardada: se unirá cuando se registre con ese correo.": "Invitation saved: they will join when they register with that email.",
  "Cuenta «{u}» creada y agregada al gremio. Pásale el usuario y la contraseña.": "Account “{u}” created and added to the guild. Give them the username and password.",
  "¿Quitar a {n} del gremio?": "Remove {n} from the guild?",
  "El código anterior dejará de funcionar. ¿Generar uno nuevo?": "The old code will stop working. Generate a new one?",

  // ---- Sesión y errores ----
  "Código: {c}": "Code: {c}",
  "Las cuentas con nombre de usuario las crea un admin desde la pestaña Miembros. Para registrarte tú, usa un correo.":
    "Accounts with a username are created by an admin from the Members tab. To sign up yourself, use an email.",
  "Usuario/correo o contraseña incorrectos (o cuenta sin confirmar).": "Wrong username/email or password (or unconfirmed account).",
  "Cuenta creada. Confirma tu correo y luego entra.": "Account created. Confirm your email and then log in.",
  "Error inesperado: ": "Unexpected error: ",
  "Sesión iniciada, pero no se pudo cargar tu gremio: ": "Logged in, but your guild could not be loaded: ",
  "No se pudo cargar el stock: ": "Could not load the stock: ",
  "El usuario debe tener 3–30 caracteres: letras, números, punto, guion o guion bajo (sin espacios ni tildes).":
    "The username must be 3–30 characters: letters, numbers, dot, hyphen or underscore (no spaces or accents).",
  "faltantes": "shortages",
  "A comprar": "To buy",
  "Usados ({n} días)": "Used ({n} days)",
};

let lang = "es";
try {
  const saved = localStorage.getItem(LS_LANG);
  lang = saved === "en" || saved === "es" ? saved : (navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en";
} catch { /* sin almacenamiento */ }

export const getLang = () => lang;
export const locale = () => (lang === "en" ? "en-US" : "es-CL");

export function t(es, vars) {
  let s = lang === "en" ? EN[es] ?? es : es;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

// ---- Traducción de los textos fijos del HTML ----
// Zonas que el código vuelve a dibujar con t(): el recorrido las ignora.
const SKIP_IDS = new Set([
  "kpis", "topUsed", "lacking", "tbodyStock", "tbodyMoves", "tbodyUploads", "tbodyMembers", "pendingList",
  "wipeList", "excludedList", "lgOut", "catTiles", "wipeBanner", "pickResults", "lSubmit", "tabExcluidos",
  "roleChip", "inviteChip", "guildSelect", "lgText", "pickedBox", "placeList",
]);
const ATTRS = ["placeholder", "title", "aria-label"];
const textOrig = new WeakMap();

function translateNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!textOrig.has(node)) textOrig.set(node, node.nodeValue);
    const orig = textOrig.get(node);
    const trimmed = orig.trim();
    if (!trimmed) return;
    const out = t(trimmed);
    node.nodeValue = orig.replace(trimmed, out);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP_IDS.has(node.id) && node.id !== "lgText" && node.id !== "guildSelect") return;
  if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
  for (const a of ATTRS) {
    if (!node.hasAttribute(a)) continue;
    const key = `i18n${a.replace("-", "")}`;
    if (node.dataset[key] === undefined) node.dataset[key] = node.getAttribute(a);
    node.setAttribute(a, t(node.dataset[key]));
  }
  if (node.id === "lgText" || node.id === "guildSelect") return; // solo sus atributos
  node.childNodes.forEach(translateNode);
}

export function applyStatic(root = document.body) {
  document.documentElement.lang = lang;
  if (document.documentElement.dataset.i18nTitle === undefined) document.documentElement.dataset.i18nTitle = document.title;
  document.title = t(document.documentElement.dataset.i18nTitle);
  translateNode(root);
  document.querySelectorAll("#langSwitch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
}

export function setLang(next) {
  if (next !== "es" && next !== "en") return;
  lang = next;
  try { localStorage.setItem(LS_LANG, next); } catch { /* sin almacenamiento */ }
}
