# 🚀 EMPIEZA AQUÍ — Finanzas Familiares

Esta es tu guía única de inicio. Responde a tu solicitud (arquitectura, estructura del
Sheet, código, librerías y despliegue) y te lleva paso a paso desde cero hasta tener la
app funcionando y compartida con tu esposa.

---

## 📦 Qué archivos tienes

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app real (producción). Es lo que subes a GitHub Pages. |
| `index-demo.html` | Versión de prueba con datos falsos. Ábrela en tu navegador para ver cómo quedó, sin configurar nada. Contraseña: `demo123` |
| `Code.gs` | El backend: código que pegas en Google Apps Script. |
| `Finanzas-Familiares-Sheet.xlsx` | Plantilla de la base de datos, lista para subir a Google Sheets. |
| `manifest.json`, `service-worker.js` | Hacen que la app sea **instalable en el celular** (PWA). |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.png` | Iconos del osito FFP para la app instalada. |
| `Gastos.csv`, `Presupuestos.csv`, `Liquidaciones.csv` | Las mismas hojas por separado, por si prefieres importarlas una a una. |
| `DEPLOY.md` | Documentación técnica detallada y registro de funcionalidades. |

**Consejo:** primero abre `index-demo.html` en tu navegador (doble clic) para ver la app
funcionando. Para que se vea el logo del osito en la demo, mantén los archivos
`icon-192.png` (y demás) en la **misma carpeta** que `index-demo.html`.

---

## 1. Arquitectura (cómo se conecta todo, de forma segura)

```
   Tu teléfono / navegador
            │
            ▼
   index.html  (GitHub Pages, público pero sin datos sensibles)
            │   fetch() con contraseña en cada petición (HTTPS)
            ▼
   Google Apps Script  (tu "backend" serverless, valida la contraseña)
            │
            ▼
   Google Sheets  (tu base de datos)
```

**Por qué es segura para uso doméstico:**
- La URL de tu Google Sheet **nunca** aparece en el código público. El frontend solo
  conoce la URL del Apps Script, que está protegida con una contraseña compartida.
- Todo el tráfico va por HTTPS (tanto GitHub Pages como Apps Script lo obligan).
- No hay API keys ni credenciales de Google en el código.

**Limitación honesta:** la contraseña viaja en las peticiones y el código es público, así
que esto protege contra curiosos, no contra un atacante decidido. Para dos personas
gestionando sus gastos del hogar es más que suficiente. (Si algún día quisieras seguridad
fuerte, el siguiente paso sería Google OAuth, más complejo.)

---

## 2. Estructura de la base de datos (Google Sheets)

Tres hojas. **Ya vienen listas en `Finanzas-Familiares-Sheet.xlsx`**, pero para que sepas
qué es cada cosa:

**Hoja `Gastos`** — cada fila es un gasto:
| ID | Fecha | Monto | Categoria | Descripcion | Persona | Lista |
|---|---|---|---|---|---|---|
| 1700000100000 | 2026-07-11 | 29000 | Crédito Anglo | Cuota | William | Familiar |

- `ID`: número único (timestamp). Lo genera la app sola.
- `Fecha`: formato `AAAA-MM-DD`.
- `Persona`: `William` o `Yinna`.
- `Lista`: `Familiar`, `Trabajo`, `Personal`, `Compras` o `TQ`.

**Hoja `Presupuestos`** — topes de gasto:
| Categoria | Monto |
|---|---|
| TOTAL | 5000000 |
| Mercado | 600000 |

- La fila `TOTAL` es el presupuesto de todo el mes. Las demás son por categoría.

**Hoja `Liquidaciones`** — pagos de deudas (se llena sola desde la app):
| MesAno | FechaPago | Monto | Persona |
|---|---|---|---|
| (vacía al inicio) | | | |

---

## 3. Librerías usadas (ligeras, desde CDN)

- **Tailwind CSS** — estilos rápidos y diseño responsivo.
- **jsPDF + html2canvas** — para generar el informe PDF capturando el dashboard tal como
  se ve en pantalla.
- **Gráficos:** en vez de Chart.js, la app usa barras hechas a mano con HTML/CSS para
  imitar el estilo visual de "Monei" (barras con emoji ancladas abajo). Son más ligeras
  y no necesitan librería externa.

Todas se cargan desde CDN, no tienes que instalar nada.

---

## ✅ PASO A PASO: de cero a la app funcionando

### Paso 1 — Crear la base de datos en Google Sheets
1. Entra a [Google Drive](https://drive.google.com) con tu cuenta.
2. Clic en **Nuevo → Subir archivo** y sube `Finanzas-Familiares-Sheet.xlsx`.
3. En Drive, haz **doble clic** en el archivo subido → se abre en vista previa →
   arriba di **"Abrir con Hojas de cálculo de Google"**.
4. Ya abierto en Hojas de Google: menú **Archivo → Guardar como Hojas de cálculo de
   Google**. Esto crea la versión nativa (la que usarás). Puedes borrar el .xlsx original.
5. (Opcional) En la hoja `Gastos`, borra las filas de ejemplo — **deja la fila 1 con los
   encabezados**. Las hojas `Presupuestos` y `Liquidaciones` déjalas como están.

### Paso 2 — Instalar el backend (Apps Script)
1. Dentro de tu Google Sheet: menú **Extensiones → Apps Script**.
2. Borra el código que aparece por defecto.
3. Abre `Code.gs` (el archivo que te di), copia **todo** su contenido y pégalo ahí.
4. Busca esta línea (arriba del todo) y cambia la contraseña por una tuya:
   ```js
   const SHARED_PASSWORD = "CAMBIA_ESTA_CLAVE";
   ```
   Ejemplo: `const SHARED_PASSWORD = "TulipanesAzules2026";`
5. Guarda (ícono de disquete o Ctrl+S).
6. Clic en **Implementar → Nueva implementación**.
   - Donde dice "Seleccionar tipo" (ícono de engranaje) elige **Aplicación web**.
   - **Ejecutar como:** Yo (tu correo).
   - **Quién tiene acceso:** Cualquiera.
   - Clic en **Implementar**.
7. Google te pedirá **autorizar permisos**. Acepta (es tu propio script; si sale una
   advertencia de "app no verificada", entra en "Configuración avanzada → Ir a (nombre)").
8. Al final te da una **URL que termina en `/exec`**. Cópiala — es tu API.

### Paso 3 — Conectar el frontend con tu backend
1. Abre `index.html` con cualquier editor de texto (Bloc de notas sirve).
2. Busca cerca del inicio del `<script>`:
   ```js
   const CONFIG = {
     API_URL: "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT"
   };
   ```
3. Reemplaza `PEGA_AQUI_TU_URL_DE_APPS_SCRIPT` por la URL `/exec` que copiaste.
   Deja las comillas. Guarda el archivo.

⚠️ La contraseña con la que entrarás a la app es la **misma** que pusiste en `Code.gs`.

### Paso 4 — Publicar en GitHub Pages
1. Crea una cuenta en [GitHub](https://github.com) si no tienes.
2. Crea un **repositorio nuevo** (botón "New"). Ponle un nombre, ej: `finanzas`.
   - Si tu cuenta es gratuita, el repo debe ser **público** para usar Pages. No hay
     problema: tu código no contiene la URL del Sheet ni contraseñas visibles en texto
     plano peligroso (la protección está en el Apps Script).
3. Sube **todos estos archivos juntos** (botón "Add file → Upload files", arrástralos todos):
   - `index.html`
   - `manifest.json`
   - `service-worker.js`
   - `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
   - `apple-touch-icon.png`, `favicon.png`

   ⚠️ Todos deben quedar en la **misma carpeta raíz** del repo (no dentro de subcarpetas),
   porque la app los busca por su nombre. Confirma con "Commit changes".
4. Ve a **Settings → Pages** (menú lateral).
5. En **"Branch"** elige `main` y carpeta `/ (root)`, y **Save**.
6. Espera 1–2 minutos. Tu app estará en:
   `https://TU-USUARIO.github.io/finanzas/`

### Paso 4.5 — Instalar la app en el celular
1. Abre el link de GitHub Pages en el celular.
2. **Android (Chrome):** aparecerá un banner "Instala la app FFP" → tócalo. O menú ⋮ →
   "Instalar aplicación".
3. **iPhone (Safari):** botón Compartir (cuadrito con flecha) → "Añadir a pantalla de inicio".
4. Quedará el ícono del osito FFP en la pantalla de inicio y abrirá a pantalla completa.

### Paso 5 — Compartir con tu esposa
1. Envíale el link de GitHub Pages y la contraseña por un medio privado (WhatsApp, en persona).
2. Ella abre el link, escribe la contraseña, elige su perfil (Yinna) y ya puede registrar
   gastos y ver el balance. Los datos de ambos van al mismo Google Sheet en tiempo real.

**Tip:** en el teléfono, al abrir el link, usa "Añadir a pantalla de inicio" en el
navegador para que quede como un ícono de app.

---

## 🔁 Cuando cambies el código más adelante

- Si editas **`index.html`**: vuelve a subirlo a GitHub (Upload files → Commit). Pages se
  actualiza solo en 1–2 min.
- Si editas **`Code.gs`**: debes crear una **nueva versión de la implementación**
  (Implementar → Gestionar implementaciones → editar ✏️ → Versión: Nueva → Implementar).
  Si no, los cambios del backend no surten efecto.

---

## 🧭 Qué puede hacer la app (resumen)

- **Perfiles:** William, Yinna o Balance General (elegibles al entrar y cambiables adentro).
- **Pantalla inicial de registro** de gastos con categorías según la lista.
- **Listas separadas** que no se mezclan: Familiar, Trabajo, Personal, Compras, TQ.
- **Balance mensual** con barras por categoría (estilo Monei, ancladas abajo).
- **Balance por meses del año** (ene–dic) para comparar y navegar tocando cada mes.
- **División 50/50** en gastos familiares: muestra quién le debe a quién y permite marcar
  la deuda como pagada con su fecha.
- **Presupuestos** por categoría y total, con alertas rojas al pasarse.
- **Alertas in-app** cuando la otra persona registra un gasto familiar.
- **Informe PDF** del mes.

Para el detalle completo de cada función, mira `DEPLOY.md`.
