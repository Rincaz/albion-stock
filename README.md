# Albion · Control de Stock

Sitio estático (HTML/CSS/JS) sobre el proyecto Supabase **regear-albion** (mismo backend de gremios que la web de regear).
Imágenes desde `render.albiononline.com`; nombres desde `items.json` (ao-bin-dumps, en inglés).

## Backend (ya aplicado)
Reutiliza `guilds`, `guild_members`, `stock` y `movements` con sus roles (admin / editor / viewer) y RLS.
Se agregó: tabla `stock_min`, y las funciones `stock_move` y `top_used`.

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
