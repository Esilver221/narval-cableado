/**
 * Hotel Narval · Cableado — fotos y distancias de cable
 *
 * Recibe lo que registra el técnico desde la página y lo guarda en tu Google Drive:
 *
 *   Fotos Hotel Narval/
 *   ├── Registro cableado Hotel Narval   (hoja de cálculo)
 *   │     · Distancias actuales  → una fila por nodo con su último registro
 *   │     · Historial distancias → cada registro que se hace (nunca se borra)
 *   │     · Fotos                → cada foto subida, con su enlace
 *   ├── Planta Baja/
 *   │     ├── CCTV (UTP)/        UTP_PBCCTV01__20261118-101530__a1b2.jpg
 *   │     └── ...
 *   ├── Nivel 1/ … Nivel 3/
 *   └── Azotea/
 *
 * Las carpetas y la hoja se crean solas. La CLAVE debe ser idéntica a la de config.js.
 */

const CLAVE = 'narval6142';                        // la misma que en config.js
const NOMBRE_CARPETA = 'Fotos Hotel Narval';       // carpeta principal en tu Drive
const NOMBRE_HOJA = 'Registro cableado Hotel Narval';
const ZONA = 'America/Mexico_City';
const NOMBRE_SCRIPT = 'Hotel Narval Cableado';

const H_ACTUAL = 'Distancias actuales';
const H_HIST = 'Historial distancias';
const H_FOTOS = 'Fotos';

// ---------- La página pregunta qué fotos y distancias hay ----------
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (String(p.clave || '').trim() !== CLAVE) return responder({ ok: false, error: 'clave' });

  // Fotos: se leen de las carpetas (el nombre del archivo empieza con el nodo)
  const fotos = {};
  const leer = (carpeta, nivel) => {
    const archivos = carpeta.getFiles();
    while (archivos.hasNext()) {
      const f = archivos.next();
      if (f.isTrashed() || f.getMimeType().indexOf('image/') !== 0) continue;
      const nodo = f.getName().split('__')[0];
      if (!nodo) continue;
      (fotos[nodo] = fotos[nodo] || []).push({ id: f.getId(), at: f.getDateCreated().toISOString() });
    }
    if (nivel >= 2) return;
    const subs = carpeta.getFolders();
    while (subs.hasNext()) { const s = subs.next(); if (!s.isTrashed()) leer(s, nivel + 1); }
  };
  leer(obtenerCarpeta(), 0);
  Object.keys(fotos).forEach(k => fotos[k].sort((a, b) => a.at < b.at ? -1 : 1));

  // Distancias: la hoja «Distancias actuales» (una fila por nodo)
  const distancias = {};
  const hoja = hojaDe(H_ACTUAL);
  const n = hoja.getLastRow();
  if (n > 1) {
    hoja.getRange(2, 1, n - 1, 6).getValues().forEach(r => {
      const nodo = String(r[0] || '').trim(), m = Number(r[3]);
      if (!nodo || !(m > 0)) return;
      distancias[nodo] = { m: m, por: String(r[4] || ''), at: r[5] instanceof Date ? r[5].toISOString() : '' };
    });
  }
  return responder({ ok: true, fotos: fotos, distancias: distancias });
}

// ---------- La página manda una foto o una distancia ----------
function doPost(e) {
  let datos;
  try { datos = JSON.parse(e.postData.contents); }
  catch (err) { return responder({ ok: false, error: 'formato' }); }
  if (String(datos.clave || '').trim() !== CLAVE) return responder({ ok: false, error: 'clave' });

  const nodo = String(datos.nodo || '').replace(/[^A-Za-z0-9_-]/g, '');
  const nivel = limpiar(datos.nivel), servicio = limpiar(datos.servicio);
  if (!nodo) return responder({ ok: false, error: 'faltan datos' });

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (datos.accion === 'distancia') return guardarDistancia(nodo, nivel, servicio, datos);
    if (datos.accion === 'foto') return guardarFoto(nodo, nivel, servicio, datos);
    return responder({ ok: false, error: 'accion' });
  } finally {
    lock.releaseLock();
  }
}

function guardarDistancia(nodo, nivel, servicio, datos) {
  const m = Math.round(Number(datos.metros) * 10) / 10;
  if (!(m > 0 && m <= 500)) return responder({ ok: false, error: 'metros' });
  const por = limpiar(datos.tecnico).slice(0, 40) || 'Sin nombre';
  const ahora = new Date();

  // Historial: siempre se agrega una fila nueva
  hojaDe(H_HIST).appendRow([ahora, nivel, servicio, nodo, m, por]);

  // Actual: se actualiza la fila del nodo (o se agrega si es la primera vez)
  const hoja = hojaDe(H_ACTUAL), n = hoja.getLastRow();
  let fila = 0;
  if (n > 1) {
    const claves = hoja.getRange(2, 1, n - 1, 1).getValues();
    for (let i = 0; i < claves.length; i++) if (String(claves[i][0]).trim() === nodo) { fila = i + 2; break; }
  }
  const valores = [[nodo, nivel, servicio, m, por, ahora]];
  if (fila) hoja.getRange(fila, 1, 1, 6).setValues(valores);
  else hoja.getRange(n + 1, 1, 1, 6).setValues(valores);

  return responder({ ok: true, at: ahora.toISOString() });
}

function guardarFoto(nodo, nivel, servicio, datos) {
  if (!datos.imagen) return responder({ ok: false, error: 'faltan datos' });
  const bytes = Utilities.base64Decode(datos.imagen);
  const fecha = Utilities.formatDate(new Date(), ZONA, 'yyyyMMdd-HHmmss');
  const nombre = nodo + '__' + fecha + '__' + Utilities.getUuid().slice(0, 4) + '.jpg';
  const destino = subcarpeta(subcarpeta(obtenerCarpeta(), nivel), servicio);
  const archivo = destino.createFile(Utilities.newBlob(bytes, 'image/jpeg', nombre));
  // Para que la página pueda mostrar la miniatura
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  hojaDe(H_FOTOS).appendRow([new Date(), nivel, servicio, nodo, nombre, archivo.getUrl()]);
  return responder({ ok: true, id: archivo.getId(), nombre: nombre });
}

// ---------- Carpeta y hoja (se crean solas la primera vez) ----------
function obtenerCarpeta() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_ID');
  if (id) {
    try { const c = DriveApp.getFolderById(id); if (!c.isTrashed()) return c; } catch (err) {}
  }
  const nueva = DriveApp.createFolder(NOMBRE_CARPETA);
  props.setProperty('CARPETA_ID', nueva.getId());
  return nueva;
}

function subcarpeta(padre, nombre) {
  nombre = String(nombre || '').replace(/[\\/]/g, '-').slice(0, 60);
  if (!nombre) return padre;
  const it = padre.getFoldersByName(nombre);
  while (it.hasNext()) { const c = it.next(); if (!c.isTrashed()) return c; }
  return padre.createFolder(nombre);
}

function libro() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('HOJA_ID');
  if (id) {
    try { if (!DriveApp.getFileById(id).isTrashed()) return SpreadsheetApp.openById(id); } catch (err) {}
  }
  const ss = SpreadsheetApp.create(NOMBRE_HOJA);
  DriveApp.getFileById(ss.getId()).moveTo(obtenerCarpeta());
  props.setProperty('HOJA_ID', ss.getId());
  return ss;
}

const ENCABEZADOS = {
  [H_ACTUAL]: ['Nodo', 'Nivel', 'Servicio', 'Metros', 'Registró', 'Fecha'],
  [H_HIST]: ['Fecha', 'Nivel', 'Servicio', 'Nodo', 'Metros', 'Registró'],
  [H_FOTOS]: ['Fecha', 'Nivel', 'Servicio', 'Nodo', 'Archivo', 'Enlace']
};

function hojaDe(nombre) {
  const ss = libro();
  let h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    const enc = ENCABEZADOS[nombre];
    h.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold').setBackground('#1c2125').setFontColor('#ffffff');
    h.setFrozenRows(1);
    const colFecha = enc.indexOf('Fecha') + 1;
    if (colFecha) h.getRange(2, colFecha, h.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    const colM = enc.indexOf('Metros') + 1;
    if (colM) h.getRange(2, colM, h.getMaxRows() - 1, 1).setNumberFormat('0.0');
    // Quita la hoja vacía que trae un libro nuevo
    const vacia = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja1');
    if (vacia && ss.getSheets().length > 1) ss.deleteSheet(vacia);
  }
  return h;
}

function limpiar(t) { return String(t || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 80); }

// Cada respuesta lleva el nombre del script, para saber cuál está publicado.
function responder(obj) {
  obj.script = NOMBRE_SCRIPT;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Ejecuta esta función una vez desde el editor: da permisos y crea la carpeta y la hoja.
function prueba() {
  const c = obtenerCarpeta();
  [H_ACTUAL, H_HIST, H_FOTOS].forEach(hojaDe);
  Logger.log('Carpeta lista: ' + c.getName() + ' → ' + c.getUrl());
  Logger.log('Hoja lista: ' + libro().getName() + ' → ' + libro().getUrl());
}
