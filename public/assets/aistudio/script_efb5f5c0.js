// Frontend Controller para MusicGrabber Local (Canciones Completas)

const presets = {
  rock: ["Queen - Bohemian Rhapsody", "Eagles - Hotel California", "AC/DC - Back in Black", "Guns N' Roses - Sweet Child O' Mine"],
  pop: ["The Weeknd - Blinding Lights", "Dua Lipa - Levitating", "Michael Jackson - Billie Jean", "Ed Sheeran - Shape of You"],
  latino: ["Luis Fonsi - Despacito", "Daddy Yankee - Gasolina", "Bad Bunny - Ojitos Lindos", "Shakira - Hips Don't Lie"]
};

// Comprobar salud del servidor y estado de FFmpeg al cargar
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      const data = await res.json();
      if (!data.ffmpeg_installed) {
        document.getElementById("ffmpegAlert")?.classList.remove("hidden");
      }
    }
  } catch (e) {
    console.warn("No se pudo conectar con el endpoint de salud:", e);
  }
});

function loadPreset(key) {
  const textarea = document.getElementById("songListInput");
  if (presets[key]) {
    textarea.value = presets[key].join("\n");
  }
}

function clearAll() {
  document.getElementById("songListInput").value = "";
  document.getElementById("resultsList").innerHTML = `
    <div id="emptyState" class="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
      <p class="text-sm text-slate-400 font-medium">Aún no has buscado canciones</p>
    </div>`;
  document.getElementById("progressContainer").classList.add("hidden");
  document.getElementById("resultsBadge").classList.add("hidden");
}

async function startSearch() {
  const input = document.getElementById("songListInput").value.trim();
  if (!input) {
    alert("Por favor ingresa al menos un nombre de canción");
    return;
  }

  const rawList = input.includes("\n") ? input.split("\n") : input.split(",");
  const songs = rawList.map(s => s.trim()).filter(s => s.length > 0);

  if (songs.length === 0) return;

  const searchBtn = document.getElementById("searchBtn");
  const btnText = document.getElementById("btnText");
  const resultsList = document.getElementById("resultsList");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressStatus = document.getElementById("progressStatus");
  const progressCount = document.getElementById("progressCount");
  const resultsBadge = document.getElementById("resultsBadge");

  // Reset UI
  searchBtn.disabled = true;
  btnText.textContent = "Buscando...";
  resultsList.innerHTML = "";
  progressContainer.classList.remove("hidden");
  resultsBadge.classList.remove("hidden");
  resultsBadge.textContent = `0 / ${songs.length}`;

  let foundCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const songQuery = songs[i];
    const pct = Math.round(((i + 1) / songs.length) * 100);
    progressBar.style.width = `${pct}%`;
    progressStatus.textContent = `Buscando canción completa: "${songQuery}"...`;
    progressCount.textContent = `${i + 1}/${songs.length}`;

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: songQuery })
      });

      if (response.ok) {
        const data = await response.json();
        foundCount++;
        renderSongRow(data, songQuery);
        resultsBadge.textContent = `${foundCount} / ${songs.length}`;
      } else {
        renderErrorRow(songQuery, "No se encontró el audio completo");
      }
    } catch (err) {
      renderErrorRow(songQuery, "Error al conectar con el servidor");
    }
  }

  searchBtn.disabled = false;
  btnText.textContent = "Buscar Canciones";
  progressStatus.textContent = "¡Búsqueda completada!";
}

function renderSongRow(song, query) {
  const list = document.getElementById("resultsList");
  const row = document.createElement("div");
  row.className = "flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition duration-150 shadow-md gap-4";

  row.innerHTML = `
    <div class="flex items-center space-x-4 min-w-0 pr-2">
      <img src="${song.thumbnail}" alt="Cover" class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-800 flex-shrink-0 shadow border border-slate-700/50" />
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm sm:text-base font-bold text-white truncate" title="${song.title}">${song.title}</h3>
          <span class="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">320 kbps</span>
        </div>
        <p class="text-xs text-slate-300 truncate mt-0.5">${song.uploader} • <span class="font-mono text-emerald-300 font-semibold">${song.duration_formatted} (Canción Completa)</span></p>
        <span class="inline-block mt-1 text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">Búsqueda: "${query}"</span>
      </div>
    </div>

    <!-- Botón verde de descarga directa de la canción completa en MP3 -->
    <div class="flex-shrink-0 self-end sm:self-center">
      <a
        href="/api/download/${song.id}"
        download
        onclick="handleDownloadClick(this)"
        class="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition duration-150 shadow-lg shadow-emerald-500/25"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <span>Descargar MP3 (Completo)</span>
      </a>
    </div>
  `;
  list.appendChild(row);
}

function renderErrorRow(query, reason) {
  const list = document.getElementById("resultsList");
  const row = document.createElement("div");
  row.className = "flex items-center justify-between p-4 bg-red-950/20 border border-red-900/40 rounded-xl";
  row.innerHTML = `
    <div>
      <h3 class="text-sm font-medium text-red-200">"${query}"</h3>
      <p class="text-xs text-red-400 mt-0.5">${reason}</p>
    </div>
    <span class="text-xs text-red-400 font-mono">No disponible</span>
  `;
  list.appendChild(row);
}

function handleDownloadClick(btn) {
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Descargando pista completa...</span>
  `;
  setTimeout(() => {
    btn.innerHTML = originalHtml;
  }, 8000);
}
