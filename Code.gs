/**
 * MONEI-APP BACKEND (Google Apps Script) — v2
 * --------------------------------------------
 * Soporta:
 * - Gastos con campo "Persona" (William / Yinna)
 * - Presupuestos por categoría y un presupuesto total mensual
 *
 * INSTALACIÓN:
 * 1. Crea una Google Sheet con DOS hojas:
 *
 *    Hoja "Gastos" — encabezados fila 1:
 *    ID | Fecha | Monto | Categoria | Descripcion | Persona
 *
 *    Hoja "Presupuestos" — encabezados fila 1:
 *    Categoria | Monto
 *    (Usa la fila con Categoria = "TOTAL" para el presupuesto mensual total)
 *
 * 2. Pega este código en Extensiones > Apps Script.
 * 3. Cambia SHARED_PASSWORD.
 * 4. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Acceso: Cualquiera
 * 5. Copia la URL /exec y pégala en index.html (CONFIG.API_URL)
 */

/**
 * MONEI-APP BACKEND (Google Apps Script) — v4
 * --------------------------------------------
 * Soporta:
 * - Gastos con campo "Persona" (William / Yinna) y campo "Lista"
 *   (Familiar / Personal / Viajes / TQ) — los gastos Personal, Viajes y TQ
 *   nunca se mezclan con los Familiar.
 * - Presupuestos por categoría y un presupuesto total mensual
 * - Liquidaciones: marcar una deuda mensual como pagada con fecha
 *
 * INSTALACIÓN:
 * 1. Crea una Google Sheet con TRES hojas:
 *
 *    Hoja "Gastos" — encabezados fila 1:
 *    ID | Fecha | Monto | Categoria | Descripcion | Persona | Lista
 *
 *    Hoja "Presupuestos" — encabezados fila 1:
 *    Categoria | Monto
 *    (Usa la fila con Categoria = "TOTAL" para el presupuesto mensual total)
 *
 *    Hoja "Liquidaciones" — encabezados fila 1:
 *    MesAno | FechaPago | Monto | Persona
 *    (MesAno en formato "YYYY-MM", ej: "2026-06")
 *
 * 2. Pega este código en Extensiones > Apps Script.
 * 3. Cambia SHARED_PASSWORD.
 * 4. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Acceso: Cualquiera
 * 5. Copia la URL /exec y pégala en index.html (CONFIG.API_URL)
 */

/**
 * MONEI-APP BACKEND (Google Apps Script) — v5
 * --------------------------------------------
 * Agrega:
 * - Hoja "Pagos": checklist de gastos fijos mensuales (Agua, Luz, Gas, etc.)
 *   que se confirman con un "OK" indicando quién pagó. Se reinicia solo cada
 *   mes porque cada fila queda ligada a un MesAno específico; un mes nuevo
 *   simplemente no tiene filas todavía (todo aparece sin confirmar).
 *
 *    Hoja "Pagos" — encabezados fila 1:
 *    MesAno | Concepto | Persona | FechaConfirmacion
 *    (MesAno en formato "YYYY-MM", ej: "2026-07")
 */

const SHARED_PASSWORD = "CAMBIA_ESTA_CLAVE";
const SHEET_GASTOS = "Gastos";
const SHEET_PRESUPUESTOS = "Presupuestos";
const SHEET_LIQUIDACIONES = "Liquidaciones";
const SHEET_PAGOS = "Pagos";

function doGet(e) {
  if (e.parameter.password !== SHARED_PASSWORD) {
    return jsonResponse_({ error: "No autorizado" }, 401);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gastos = sheetToObjects_(ss.getSheetByName(SHEET_GASTOS));
  const presupuestos = sheetToObjects_(ss.getSheetByName(SHEET_PRESUPUESTOS));
  const liquidaciones = sheetToObjects_(ss.getSheetByName(SHEET_LIQUIDACIONES));
  const pagos = sheetToObjects_(ss.getSheetByName(SHEET_PAGOS));

  return jsonResponse_({ gastos: gastos, presupuestos: presupuestos, liquidaciones: liquidaciones, pagos: pagos });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ error: "JSON inválido" }, 400);
  }

  if (body.password !== SHARED_PASSWORD) {
    return jsonResponse_({ error: "No autorizado" }, 401);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (body.action === "addGasto") {
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    const id = new Date().getTime().toString();
    sheet.appendRow([
      id,
      body.fecha,
      Number(body.monto),
      body.categoria,
      body.descripcion || "",
      body.persona,
      body.lista || "Familiar"
    ]);
    return jsonResponse_({ success: true, id: id });
  }

  if (body.action === "editGasto") {
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf("ID");
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) {
      return jsonResponse_({ error: "Gasto no encontrado" }, 404);
    }
    // Mantiene el ID y la Persona original; actualiza el resto de campos editables.
    const fila = [
      data[rowIndex - 1][idCol],
      body.fecha,
      Number(body.monto),
      body.categoria,
      body.descripcion || "",
      data[rowIndex - 1][headers.indexOf("Persona")],
      body.lista || data[rowIndex - 1][headers.indexOf("Lista")] || "Familiar"
    ];
    sheet.getRange(rowIndex, 1, 1, fila.length).setValues([fila]);
    return jsonResponse_({ success: true });
  }

  if (body.action === "deleteGasto") {
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf("ID");
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) {
      return jsonResponse_({ error: "Gasto no encontrado" }, 404);
    }
    sheet.deleteRow(rowIndex);
    return jsonResponse_({ success: true });
  }

  if (body.action === "setBudget") {
    const sheet = ss.getSheetByName(SHEET_PRESUPUESTOS);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.categoria) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 2).setValue(Number(body.monto));
    } else {
      sheet.appendRow([body.categoria, Number(body.monto)]);
    }
    return jsonResponse_({ success: true });
  }

  if (body.action === "marcarPago") {
    // body.mesAno: "YYYY-MM", body.fechaPago: "YYYY-MM-DD", body.monto, body.persona (quien pagó)
    const sheet = ss.getSheetByName(SHEET_LIQUIDACIONES);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.mesAno) {
        rowIndex = i + 1;
        break;
      }
    }
    const fila = [body.mesAno, body.fechaPago, Number(body.monto), body.persona];
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, fila.length).setValues([fila]);
    } else {
      sheet.appendRow(fila);
    }
    return jsonResponse_({ success: true });
  }

  if (body.action === "deshacerPago") {
    const sheet = ss.getSheetByName(SHEET_LIQUIDACIONES);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.mesAno) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return jsonResponse_({ success: true });
  }

  if (body.action === "confirmarPago") {
    // body.mesAno: "YYYY-MM", body.concepto: ej. "Agua", body.persona: quien pagó,
    // body.fecha: "YYYY-MM-DD" (fecha de confirmación)
    const sheet = ss.getSheetByName(SHEET_PAGOS);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.mesAno && data[i][1] === body.concepto) {
        rowIndex = i + 1;
        break;
      }
    }
    const fila = [body.mesAno, body.concepto, body.persona, body.fecha];
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, fila.length).setValues([fila]);
    } else {
      sheet.appendRow(fila);
    }
    return jsonResponse_({ success: true });
  }

  if (body.action === "deshacerConfirmacionPago") {
    // body.mesAno, body.concepto
    const sheet = ss.getSheetByName(SHEET_PAGOS);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.mesAno && data[i][1] === body.concepto) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return jsonResponse_({ success: true });
  }

  return jsonResponse_({ error: "Acción no reconocida" }, 400);
}

// --- Helpers ---

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const tz = Session.getScriptTimeZone();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Google Sheets devuelve las celdas de fecha como objetos Date (con hora
        // y zona horaria). Sin normalizar, al viajar por JSON se convierten a
        // ISO con hora (ej: "2026-07-03T05:00:00.000Z"), lo que rompe los
        // <input type="date"> del frontend y puede correr el día mostrado
        // según la zona horaria del navegador. Se deja como "yyyy-MM-dd" plano.
        if (val instanceof Date) {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        }
        obj[h] = val;
      });
      return obj;
    });
}

function jsonResponse_(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
