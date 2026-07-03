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

const SHARED_PASSWORD = "CAMBIA_ESTA_CLAVE";
const SHEET_GASTOS = "Gastos";
const SHEET_PRESUPUESTOS = "Presupuestos";
const SHEET_LIQUIDACIONES = "Liquidaciones";

function doGet(e) {
  if (e.parameter.password !== SHARED_PASSWORD) {
    return jsonResponse_({ error: "No autorizado" }, 401);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gastos = sheetToObjects_(ss.getSheetByName(SHEET_GASTOS));
  const presupuestos = sheetToObjects_(ss.getSheetByName(SHEET_PRESUPUESTOS));
  const liquidaciones = sheetToObjects_(ss.getSheetByName(SHEET_LIQUIDACIONES));

  return jsonResponse_({ gastos: gastos, presupuestos: presupuestos, liquidaciones: liquidaciones });
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

  return jsonResponse_({ error: "Acción no reconocida" }, 400);
}

// --- Helpers ---

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

function jsonResponse_(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
