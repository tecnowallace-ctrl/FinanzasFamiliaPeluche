# Guía de despliegue — Finanzas Familiares

## Paso 0 (opcional pero recomendado): usar la plantilla lista
En vez de crear las hojas a mano, puedes partir del archivo `Finanzas-Familiares-Sheet.xlsx`
que ya trae las tres hojas con los encabezados correctos y datos de ejemplo:
1. Entra a Google Drive → Nuevo → Subir archivo → sube `Finanzas-Familiares-Sheet.xlsx`.
2. Clic derecho sobre el archivo subido → Abrir con → Hojas de cálculo de Google.
3. Archivo → Guardar como Hojas de cálculo de Google (para convertirlo a formato nativo).
4. Borra las filas de ejemplo de la hoja "Gastos" si no las quieres (deja la fila 1 de
   encabezados intacta). Las hojas "Presupuestos" y "Liquidaciones" puedes dejarlas como están.
5. Continúa desde el Paso 2 (Apps Script) usando esta hoja.

Si prefieres, también están los CSV sueltos (`Gastos.csv`, `Presupuestos.csv`,
`Liquidaciones.csv`) por si quieres importarlos por separado.

## Paso 1: Crear la Google Sheet
1. Crea una hoja de cálculo nueva en Google Sheets.
2. Crea **tres hojas** dentro del archivo:

   **Hoja "Gastos"** — encabezados en fila 1 (exactos, en este orden):
   `ID | Fecha | Monto | Categoria | Descripcion | Persona | Lista`
   - `Lista` debe ser uno de: `Familiar`, `Personal`, `Viajes`, `TQ`.

   **Hoja "Presupuestos"** — encabezados en fila 1:
   `Categoria | Monto`
   - Usa la fila `TOTAL | <monto>` para el presupuesto mensual general.
   - Una fila por cada categoría que quieras limitar (ej: `Mercado | 600000`).
   - Si una categoría no tiene fila, simplemente no tiene límite (no genera alertas).

   **Hoja "Liquidaciones"** — encabezados en fila 1:
   `MesAno | FechaPago | Monto | Persona`
   - Se llena automáticamente cuando alguien marca una deuda como pagada desde la app.
   - `MesAno` queda en formato `AAAA-MM` (ej: `2026-06`).

## Paso 2: Configurar Apps Script (el backend)
1. En la Sheet: **Extensiones > Apps Script**.
2. Borra el contenido por defecto y pega el contenido de `Code.gs`.
3. Cambia la línea:
   ```js
   const SHARED_PASSWORD = "CAMBIA_ESTA_CLAVE";
   ```
   por una contraseña que tú y tu esposa recordarán fácilmente.
4. Guarda el proyecto (Ctrl+S / ícono de guardar).
5. Click en **Implementar > Nueva implementación**.
   - Tipo de implementación: **Aplicación web**.
   - Ejecutar como: **Yo** (tu cuenta de Google).
   - Quién tiene acceso: **Cualquiera**.
6. Autoriza los permisos cuando Google te lo pida (es tu propio script, es seguro).
7. Copia la URL que termina en `/exec`. Esa es tu API.

⚠️ **Nota:** cada vez que edites `Code.gs`, debes crear una **nueva implementación**
(o "Gestionar implementaciones > Editar > Nueva versión") para que los cambios surtan efecto.

## Paso 3: Configurar el frontend
1. Abre `index.html`.
2. Busca la línea:
   ```js
   const CONFIG = {
     API_URL: "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT"
   };
   ```
3. Pega la URL que copiaste en el paso anterior.
4. Asegúrate de que la contraseña en `Code.gs` sea la que usarás para entrar a la app
   (es la misma, no hay dos contraseñas distintas).

## Paso 4: Subir a GitHub Pages
1. Crea un repositorio nuevo en GitHub (puede ser privado, GitHub Pages funciona con
   repos privados también si tienes plan Pro; si es plan gratuito, debe ser público —
   en ese caso la URL del Sheet *no* queda expuesta porque nunca está en el código,
   solo la URL del Apps Script, que ya está protegida con contraseña).
2. Sube `index.html` a la raíz del repositorio.
3. Ve a **Settings > Pages**.
4. En "Source" selecciona la rama `main` y carpeta `/ (root)`.
5. Guarda. En unos minutos tu app estará disponible en:
   `https://tu-usuario.github.io/tu-repositorio/`

## Paso 5: Compartir con tu esposa
Simplemente compártele el link de GitHub Pages y la contraseña por un canal seguro
(WhatsApp, en persona, etc.). Ella entra, pone la contraseña, y puede registrar
gastos y ver el dashboard igual que tú.

## Notas de seguridad
- La contraseña viaja en cada request (GET como query param, POST en el body).
  No es cifrado de extremo a extremo, pero al usar HTTPS (tanto GitHub Pages como
  Apps Script lo fuerzan) el tráfico está cifrado en tránsito.
- No subas nunca el ID real de tu Sheet como comentario público ni en el README del repo.
- Si alguna vez sospechas que la contraseña se filtró, cámbiala en `Code.gs`,
  crea una nueva implementación, y actualiza `index.html`.

## Personalización rápida
- **Categorías:** edítalas en el array `CATEGORIAS` y en el `<select id="categoria">` de `index.html` (deben coincidir en ambos lugares).
- **Colores/diseño:** todo usa clases de Tailwind, fácil de ajustar sin tocar lógica.
- **Más usuarios:** si más adelante quieres roles distintos, lo siguiente sería migrar
  de "contraseña compartida" a Google OAuth con Apps Script `Session.getActiveUser()`.

## Funcionalidades v9
- **App instalable (PWA):** la app ahora se puede instalar en el celular como si fuera
  una aplicación nativa (ícono en la pantalla de inicio, pantalla completa sin barra del
  navegador). Requiere subir a GitHub Pages junto con `index.html` estos archivos:
  `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png` y `favicon.png` (todos en la misma carpeta).
  - **En Android/Chrome:** al abrir la web aparece un banner "Instala la app FFP", o desde
    el menú del navegador → "Instalar aplicación / Añadir a pantalla de inicio".
  - **En iPhone/Safari:** botón Compartir → "Añadir a pantalla de inicio".
  - El service worker permite que el "cascarón" cargue aunque no haya buena señal; los
    datos de gastos siempre se piden en vivo al Sheet.
- **Branding "Finanzas Familia Peluche" (FFP):** logo del osito, tipografías Montserrat
  (títulos y texto) y Libre Baskerville (nombre de la marca), y la paleta oficial:
  Azul Confianza `#0D47A1`, Verde Crecimiento `#198754`, Celeste Calidez `#E3F2FD`,
  Crema Hogar `#FFF8E1`.
- **Tarjetas de categoría con color:** cada categoría tiene un color propio, visible tanto
  en las barras del dashboard como en el ícono de cada transacción, para diferenciarlas
  de un vistazo.

## Funcionalidades v8
- **Balance por meses del año:** en la pestaña Balance, arriba de todo, hay una gráfica
  de barras con los 12 meses del año en curso (ene–dic) para la lista seleccionada.
  Cada barra muestra el gasto de ese mes; el mes que estás viendo aparece resaltado en
  rojo. Al tocar cualquier barra, el detalle de abajo (total, categorías, balance,
  transacciones) salta a ese mes. Respeta la lista activa: si estás en "Gastos
  Familiares" ves el año en familiar, si cambias a "Compras" ves el año en compras, etc.
  Para ver otro año, usa las flechas ← → del mes hasta cruzar a diciembre/enero.

## Funcionalidades v7
- **Alertas de gastos familiares (notificación in-app):** en el header hay una campana 🔔.
  Al abrir su panel, cada persona puede activar/desactivar las alertas con un interruptor.
  Cuando están activas, si la otra persona registra un gasto en la lista **Familiar**,
  aparece un contador rojo en la campana y el detalle en el panel (quién, categoría,
  descripción, monto). El botón "Marcar todas como vistas" limpia el contador.
  - Mientras la app está abierta, revisa cada 30 segundos si hay gastos familiares
    nuevos de la otra persona (vuelve a leer el Sheet automáticamente).
  - **Limitación importante:** como la app es una web sin servidor propio, la alerta
    solo aparece cuando la persona tiene la app abierta o la abre. No es una
    notificación "push" que suene con la app cerrada (eso requeriría una app nativa o
    infraestructura de push adicional). Si más adelante quieres avisos con la app
    cerrada, la vía más simple sería que `Code.gs` envíe un email o un mensaje de
    Telegram al registrar el gasto — se puede añadir sin cambiar el resto.
  - Solo aplica a la lista **Familiar** y solo avisa de los gastos de la *otra* persona
    (William ve los de Yinna y viceversa). La vista Balance General no recibe alertas.

## Funcionalidades v6
- **Pantalla inicial = Registrar:** al entrar como William o Yinna, lo primero que ves
  es la pantalla de registro de gasto, con un resumen del mes arriba (total + barras).
  Balance General entra directo al Balance (es de solo consulta, no registra).
- **Barras ancladas abajo:** las barras por categoría ahora crecen de abajo hacia
  arriba como en Monei, ordenadas de mayor a menor gasto.
- **Listas por perfil:**
  - William: Gastos de familia, Gastos del trabajo, Gastos personales, Compras, Gastos TQ.
  - Yinna: Gastos Familiares, Gastos del trabajo, Marketing afectivo TQ, Gastos Personales, Compras.
  - Balance General: Gastos Familiares y Gastos TQ (las compartidas).
  - "Familiar" y "TQ" son compartidas entre ambos; "Trabajo", "Personal" y "Compras"
    son individuales (cada uno ve solo lo suyo). **Solo la lista Familiar divide 50/50**
    y muestra el desglose por persona + quién le debe a quién.
- **Categorías de Gastos Familiares por perfil:**
  - William: Arriendo Tulipanes, Carro, Crédito Anglo, Impuestos, Mathias, Salomé,
    Mercado, Medicamentos, Salidas a Restaurantes, Salidas y Recreación,
    Servicios Apartamento, Gastos de Viajes, Gastos Varios.
  - Yinna: igual pero sin "Crédito Anglo".
  - Las demás listas usan categorías genéricas (Alimentación, Transporte, Ropa, etc.).
- **Selector de mes siempre visible:** desde cualquier pantalla se puede cambiar de
  mes (← →) y de lista; todos los totales, barras y transacciones responden al mes y
  la lista activos. Los datos de cada mes son independientes — la vista "se reinicia"
  cada mes de forma natural porque solo muestra el mes seleccionado.

## Funcionalidades v5
- **Listas separadas (Familiar / Personal / Viajes / TQ):** cada gasto pertenece a una
  "lista". Al registrar un gasto, primero eliges a cuál pertenece. La pantalla de
  Balance siempre arranca en "Gastos Familiares" y desde el selector "en [Lista] ▾"
  (junto al mes) puedes cambiar a ver tus gastos Personales, los de Viajes o los de TQ.
  **Estas listas nunca se mezclan entre sí:** el total, las barras por categoría, las
  transacciones y las alertas de presupuesto se calculan solo con los gastos de la
  lista seleccionada.
  - **Personal** es exclusivo de cada perfil: William solo ve sus propios gastos
    personales, y Yinna los suyos — nunca se cruzan entre ambos.
  - **Familiar, Viajes y TQ** son compartidos entre ambos perfiles (se ven igual desde
    William, Yinna o Balance General), y son los únicos que muestran el desglose por
    persona y el cálculo de "quién le debe a quién" (50/50). En modo Personal no
    aplica ese cálculo porque, por definición, solo una persona participa.
- **Vista por categorías con barras:** la pantalla de Balance ahora muestra barras
  estilo "Monei" con el ícono de cada categoría y el monto en formato compacto
  (ej: 1.7M, 596K), igual para cualquier perfil o la vista de Balance General — es
  lo primero que se ve al entrar.

## Funcionalidades v4
- **Vista de Balance General:** en la pantalla "¿Quién eres?" hay una tercera opción,
  "📊 Balance General", además de William y Yinna. Al elegirla se entra en modo
  solo-consulta: se ven los gastos y pagos sumados de ambos, se puede navegar por
  meses con las flechas, y descargar el informe consolidado en PDF — pero no aparecen
  las pestañas de "Registrar" ni "Presupuestos", porque esta vista es para revisar,
  no para modificar datos. Desde el header se puede "cambiar" a un perfil personal en
  cualquier momento.
- **Perfiles dentro de la app:** la contraseña ya no está atada a un perfil. Al entrar,
  se pide elegir "¿Quién eres?" (William o Yinna). Desde el header hay un enlace
  "cambiar" para cambiar de perfil en cualquier momento sin volver a escribir la
  contraseña — útil si comparten el mismo teléfono o se turnan en el computador.
- **Balance por mes:** usa las flechas ← → arriba del dashboard para navegar entre meses.
- **Quién le debe a quién:** se calcula asumiendo que todos los gastos registrados se
  dividen 50/50 entre ambos, comparando lo que pagó cada uno en el mes.
- **Marcar deuda como pagada:** cuando hay una deuda pendiente, aparece el botón
  "Marcar deuda como pagada". Pide confirmar la fecha del pago y queda registrado en
  la hoja `Liquidaciones`. Una vez marcado, ese mes muestra "✓ Deuda saldada" con la
  fecha y el monto, sin importar que sigan navegando entre meses. Se puede deshacer
  con el enlace "Deshacer / corregir" si fue un error.
- **Presupuestos:** en la pestaña "🎯 Presupuestos" puedes fijar un tope total mensual
  y/o topes por categoría. Si el gasto real supera el tope, aparece una alerta roja en
  la pestaña de Balance.
- **Informe PDF:** el botón "Generar informe del mes" captura el dashboard del mes
  seleccionado (totales, alertas, balance, deuda, gráficos) y lo descarga como PDF.

## Nota sobre el cálculo de deuda
El modelo asume que **todo** lo que cada uno registra es un gasto compartido del hogar
dividido 50/50. Si en el futuro necesitas marcar algunos gastos como "personales" (que
no se dividen), habría que agregar un campo adicional `Compartido: Sí/No` en la Sheet
y ajustar la fórmula de `renderDeuda()` para excluir los gastos personales del cálculo.
