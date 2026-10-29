# Plan de Acción: Descargas Directas Reales y Limpieza del Reproductor Móvil

Este plan aborda punto por punto las fallas reportadas y las capturas de pantalla proporcionadas por el usuario:

---

## 1. Diagnóstico de los Problemas Reportados

1. **Descarga individual envía a un "panel de ligas":**
   - Actualmente al pulsar descargar se abre `FullTrackDownloadModal` con enlaces a sitios externos (yout.com, dirpy.com).
   - **Solución solicitada:** Al pulsar el botón de descarga en una canción, debe iniciarse **la descarga directa del archivo MP3 completo** en el navegador/celular sin intermediarios ni pantallas de enlaces.

2. **Descarga de ZIP y M3U "no descargan nada" (Archivo de 178 KB):**
   - La captura muestra que `Carpeta_Favoritas_Movil.zip` pesa apenas 178 KB porque solo empaqueta archivos de texto (.csv y .m3u) sin los audios MP3 reales.
   - **Solución:** Implementar un descargador en lote que obtenga el audio completo de cada canción y lo empaquete con su MP3 real, o proporcione un descargador secuencial directo al almacenamiento del celular.

3. **Eliminar "Escucha Rápida":**
   - En la parte superior del reproductor completo (`FullPlayerModal.tsx`) aparece la pestaña `⚡ Escucha Rápida` (modo preview de 30s).
   - **Solución:** Eliminar completamente el botón y el concepto de "Escucha Rápida". La app debe operar exclusivamente en modo **Canción Completa**.

4. **Reproductor cortado abajo (Eliminar Deezer y Spotify):**
   - En la captura `image_e8928c88.png`, los botones de Deezer y Spotify quedan cortados por el borde inferior de la pantalla debido a la altura del modal.
   - **Solución:**
     - Eliminar definitivamente los botones externos de Deezer y Spotify.
     - Ajustar el contenedor con `min-h-0`, `max-h-[90vh]` y scroll suave para que todos los controles (vinilo, barra de tiempo, volumen, botones de letras y ecualizador) sean 100% visibles en cualquier pantalla móvil.

---

## 2. Cambios Específicos por Componente

### A. Reproductor Completo (`src/components/FullPlayerModal.tsx`)
- **Eliminar selector "⚡ Escucha Rápida / Completa":** Forzar la reproducción siempre en audio completo.
- **Eliminar botones externos de Deezer y Spotify** del pie del reproductor.
- **Ajuste de dimensiones móviles:** Garantizar que todo el reproductor quepa en la pantalla sin desbordes ni botones mochados.

### B. Descarga Individual Directa (`src/App.tsx` y `src/utils/downloadHelper.ts`)
- **Descarga con 1 toque:** Al presionar el botón de descarga en la tabla o reproductor, llamar a un endpoint de descarga directa `/api/full-audio/download` que resuelve el stream de audio completo y dispara el guardado del archivo `.mp3` en el celular (`Artista - Título.mp3`).
- Eliminar el modal con enlaces externos para descargas individuales.

### C. Backend de Descarga de Audio Completo (`vite.config.ts` y `/api/full-audio/download.js`)
- Añadir middleware en Vite y endpoint serverless para resolver y transmitir el archivo de audio completo de la canción directamente como un flujo MP3 (`audio/mpeg` con `Content-Disposition: attachment`).

### D. Descarga de Carpeta / ZIP Real (`src/components/FolderDownloadModal.tsx` y `downloadHelper.ts`)
- Reemplazar la simulación que generaba zips de 178 KB.
- Descargar y almacenar en la memoria offline los audios completos reales para que el ZIP contenga los archivos de audio MP3 pesados (ej. 3 a 7 MB por canción) y la lista pueda escucharse 100% sin conexión.

---

## 3. Verificación
1. Probar la descarga directa de una canción individual y constatar que se guarde un archivo `.mp3` real en el dispositivo.
2. Comprobar que en el reproductor ya no figure "Escucha Rápida" ni los botones de Deezer/Spotify, y que todos los controles se vean completos.
3. Compilar la aplicación y verificar que no haya errores de TypeScript ni de bundler.
