# Albion · Control de Stock

Sitio estático (HTML/CSS/JS) sobre el proyecto Supabase **regear-albion** (mismo backend de gremios que la web de regear).
Imágenes desde `render.albiononline.com`; nombres desde `items.json` (ao-bin-dumps, en inglés).

## Backend (ya aplicado)
Reutiliza `guilds`, `guild_members`, `stock` y `movements` con sus roles (admin / editor / viewer) y RLS.
Se agregó: `stock_min`, `stock_settings` (mínimo por defecto compartido), `stock_uploads` (registro de subidas), `stock_wipe_requests` (borrado con confirmación) y las funciones `stock_move`, `top_used`, `stock_import_log`, `stock_wipe_request` y `stock_wipe_resolve`.

## Desplegar en Vercel
1. Sube la carpeta a GitHub.
2. Vercel → Add New → Project → importa el repo. Framework Preset: **Other**, sin Build Command. Deploy.

## Uso
1. Crea tu cuenta, luego **crea un gremio** (serás admin) o **únete con el código de invitación**.
2. **Registrar movimiento**: busca el item, elige encantamiento (.0–.4), tipo, cantidad y ubicación opcional.
3. Define el **stock mínimo** en el mismo diálogo para que aparezca en *Faltantes*.
4. Solo admin/editor pueden registrar movimientos; los viewers solo ven.

## Notas
- "Más utilizados" suma las salidas (cantidades negativas en `movements`) del período, incluidas las del registro del banco.
- Si Auth tiene confirmación de correo activa, tras crear la cuenta hay que confirmar el correo.

## Equivalencias y nombres
- **Equivalencias de equipo:** mismo tipo de item y misma suma tier + encantamiento (T6.3 = T7.2 = T8.1). Aplica a armas, armaduras, cascos, botas, capas, bolsas y offhands; no a pociones, comida ni recursos. Se activa/desactiva con la casilla "Contar equivalentes" (por defecto activada) y afecta estado, faltantes y cobertura.
- **Nombres en español** (ES-ES, de ao-bin-dumps); la búsqueda también entiende inglés y no distingue tildes.

## Subir stock (log del cofre)
- Pestaña **Subir log**: pega el log copiado del cofre del gremio (o carga el archivo), indica la ubicación y pulsa **Previsualizar**; luego **Aplicar al stock**.
- Formato: `Fecha, Jugador, Objeto, Encantamiento, Calidad, Cantidad` (con comillas o separado por tabulaciones). El nombre del objeto se reconoce en español o inglés.
- **Sin duplicados:** las líneas ya subidas se ignoran. Se usa el mismo registro de líneas vistas que la web de regear (`guild_docs.logSeen`), así que un log subido en una web no se vuelve a cargar en la otra.
- **Registro de subidas:** cada subida queda anotada con día y hora, quién la hizo, rango del log, líneas nuevas/repetidas y unidades.

## Borrado total del stock
Admin o editor pueden **solicitar** el borrado; no se borra nada hasta que un **admin lo confirma** (o lo rechaza). Al confirmar, queda un movimiento de ajuste por cada item (no cuenta como uso) y el registro de la solicitud.

## Mínimo por defecto compartido
El valor de "Faltante si hay menos de N uds." se guarda en el gremio y lo cambia solo un admin.
