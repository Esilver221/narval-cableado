# Hotel Narval · Cableado — Configurar el script de Google Drive

Página de campo para registrar **foto** y **distancia de cable** de cada nodo
(Datos, TV, CCTV, Access Point, Dúplex 18 AWG y X3) en Planta Baja, Niveles 1 a 3 y Azotea.

```
Pagina evidencias Narval/
├── index.html          la página
├── config.js           aquí va la URL del script (por ahora vacía = modo prueba)
├── plano-pb.png  plano-n1.png  plano-n2.png  plano-n3.png  plano-az.png
├── LEEME.md
└── apps-script/
    └── Code.gs         el script de Google (clave narval6142)
```

Lo que registren los técnicos queda así en tu Google Drive (todo se crea solo):

```
Fotos Hotel Narval/
├── Registro cableado Hotel Narval      ← hoja de Google Sheets
│     · Distancias actuales   una fila por nodo con su último registro
│     · Historial distancias  cada registro que se hace (aunque se corrija)
│     · Fotos                 cada foto subida, con su enlace
├── Planta Baja/
│     ├── CCTV (UTP)/          UTP_PBCCTV01__20261118-101530__a1b2.jpg
│     └── Datos UTP CAT5e/ …
├── Nivel 1/  Nivel 2/  Nivel 3/
└── Azotea/
```

Es un proyecto **nuevo e independiente**: no toques los scripts de Monterrey
(MTY-Sen ni N2 Obra 2026); siguen funcionando igual.

---

## Parte 1 — Crear el proyecto y pegar el código

1. Entra a <https://script.google.com> con la cuenta de Google donde quieres guardar
   las fotos.
2. Da clic en **Nuevo proyecto**.
3. Arriba a la izquierda, donde dice **Proyecto sin título**, da clic y ponle
   **Hotel Narval Cableado** → **Cambiar nombre**.
4. Haz clic dentro del editor, selecciona todo (**Ctrl+A**) y bórralo (**Supr**).
5. Abre `apps-script/Code.gs` de esta carpeta con el **Bloc de notas**, selecciona todo
   (**Ctrl+A**), copia (**Ctrl+C**) y pégalo en el editor (**Ctrl+V**).
6. Revisa estas líneas (casi al inicio):
   - `const CLAVE = 'narval6142';`
   - `const NOMBRE_CARPETA = 'Fotos Hotel Narval';`
7. Guarda con **Ctrl+S** (el icono del disquete).

## Parte 2 — Dar permisos y crear la carpeta

1. Arriba, junto al botón **Ejecutar**, hay una lista de funciones. Elige **prueba**.
2. Da clic en **Ejecutar**.
3. La primera vez Google pide permisos:
   **Revisar permisos → elige tu cuenta → Configuración avanzada →
   Ir a Hotel Narval Cableado (no seguro) → Permitir**.
   (Dice «no seguro» solo porque el script es tuyo y Google no lo ha revisado.)
4. Abajo, en el **Registro de ejecución**, deben aparecer dos líneas:
   - `Carpeta lista: Fotos Hotel Narval → https://drive.google.com/…`
   - `Hoja lista: Registro cableado Hotel Narval → https://docs.google.com/…`
5. Revisa tu Google Drive: debe existir la carpeta **Fotos Hotel Narval** con la hoja
   **Registro cableado Hotel Narval** adentro (con las pestañas *Distancias actuales*,
   *Historial distancias* y *Fotos*).

## Parte 3 — Publicar el script

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Junto a **Seleccionar tipo**, da clic en el engrane ⚙ → **Aplicación web**.
3. Llena así:
   - **Descripción:** `Hotel Narval v1`
   - **Ejecutar como:** **Yo** (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**
4. Da clic en **Implementar**. Si vuelve a pedir permisos, acéptalos igual que en la Parte 2.
5. Copia la **URL de la aplicación web**. Es larga y termina en **`/exec`**:
   ```
   https://script.google.com/macros/s/AKfycb……………/exec
   ```

## Parte 4 — Probar el script (no avances sin esto)

Pega en el navegador la URL que copiaste, agregándole al final `?clave=narval6142`:

```
https://script.google.com/macros/s/AKfycb……………/exec?clave=narval6142
```

Debe salir:

```
{"ok":true,"fotos":{},"distancias":{},"script":"Hotel Narval Cableado"}
```

| Respuesta | Qué significa |
|---|---|
| `{"ok":true,…,"script":"Hotel Narval Cableado"}` | Todo bien, sigue a la Parte 5. |
| `{"ok":false,"error":"clave",…}` | La clave del script no es `narval6142`: revisa la Parte 1 paso 6 y publica una versión nueva (ver abajo). |
| Página de Google pidiendo iniciar sesión o con error | En la Parte 3 no quedó **Quién tiene acceso: Cualquier usuario**. |
| «No se encontró la función doGet» | El código no se guardó: repite la Parte 1 desde el paso 4. |

## Parte 5 — Conectar la página y publicarla

Mándame (a Claude) la **URL que termina en `/exec`**. Yo la pego en `config.js`,
creo el repositorio en GitHub, subo la página y activo GitHub Pages.

Si algún día lo haces tú: abre `config.js` con el Bloc de notas y pega la URL entre
las comillas de `API_URL: ''`, guarda y súbelo a GitHub.

## Parte 6 — Prueba antes de mandarla a campo

1. Abre la página en una **pestaña privada** del celular. Ya no debe aparecer el aviso
   amarillo de «Modo prueba».
2. Toca un nodo → escribe una distancia y tu nombre → **Guardar**.
   Revisa que aparezca en la hoja **Distancias actuales**.
3. Toca **Tomar foto** → espera «Foto … guardada ✓». Revisa que la foto aparezca en
   su carpeta (por ejemplo `Nivel 3 / CCTV (UTP)`) y en la pestaña **Fotos** de la hoja.
4. Para quitar los datos de prueba: borra la foto en Drive y las filas en la hoja.

---

## Si cambias el código después

Cada vez que edites `Code.gs` en script.google.com, la página sigue usando la versión
anterior hasta que publiques una nueva:
**Implementar → Gestionar implementaciones → lápiz (editar) → Versión: Nueva versión →
Implementar**. La URL **no cambia**.

## Cómo funciona la página

| Botón | Qué hace |
|---|---|
| Pestañas **Nivel** | Cambia entre Planta Baja, Nivel 1, 2, 3 y Azotea. Muestran cuántos nodos están completos. |
| Pestañas **Servicio** | Todos, Datos, TV, CCTV, Access Point, Dúplex o X3. |
| Tocar un nodo | Abre su ficha: distancia de cable (m), nombre de quien registra y foto. |
| Colores | Amarillo: falta foto y distancia · Naranja: falta una · Verde: completo. |
| **Capas y conteo** | Etiquetas, tamaño, colorear por avance o por servicio, conteo y metros del nivel. |
| **Siguiente** | Lleva al siguiente nodo que falta. |
| **Exportar plano PNG** | Descarga el plano del nivel con los nodos, metros y tabla de conteo. |
| **Descargar registro CSV** | Descarga todos los nodos con metros, fotos, quién registró y fecha (abre en Excel). |
| Resumen de cable registrado | Tabla de metros por servicio y nivel, con totales. |

Si se corrige una distancia, la página muestra la más reciente; la hoja
**Historial distancias** guarda todas.

## Si algo no funciona

| Lo que ves | Qué hacer |
|---|---|
| «Modo prueba…» | `API_URL` está vacío en el `config.js` publicado en GitHub. |
| «La clave … no coincide…» | `config.js` y `Code.gs` deben decir `narval6142`. Publica una versión nueva del script. |
| «No se pudo conectar con Google Drive» | La implementación debe decir **Cualquier usuario** y la URL terminar en `/exec`. |
| «No se pudo guardar la distancia» | Falta señal: muévete y toca **Guardar** otra vez (el número sigue escrito). |
| «No se pudo subir la foto» | Toca **Reintentar** con mejor señal, o **Guardar en el teléfono** y mándasela al supervisor. |
| Se ve la página vieja | Ábrela en pestaña privada o espera 2 minutos a que GitHub termine de publicar. |
