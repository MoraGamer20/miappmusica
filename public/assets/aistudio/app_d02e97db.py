"""
Buscador y Descargador de Música MP3 - CANCIONES COMPLETAS
Backend en Python usando Flask, yt-dlp y FFmpeg.
Descarga canciones completas (sin límites de 30 segundos) a máxima calidad (320 kbps).
"""

import os
import re
import shutil
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Carpeta para almacenar los MP3 completos antes de enviarlos al navegador
DOWNLOAD_DIR = os.path.join(tempfile.gettempdir(), "music_downloads_full")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def check_ffmpeg_installed() -> bool:
    """Comprueba si FFmpeg está instalado en el sistema del usuario."""
    return shutil.which("ffmpeg") is not None


def sanitize_filename(name: str) -> str:
    """Limpia caracteres especiales no permitidos en nombres de archivo."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned if cleaned else "cancion_completa"


@app.route("/")
def index():
    """Página principal."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Verifica si FFmpeg y yt-dlp están listos."""
    has_ffmpeg = check_ffmpeg_installed()
    return jsonify({
        "status": "ok",
        "ffmpeg_installed": has_ffmpeg,
        "message": (
            "FFmpeg detectado correctamente. ¡Listo para descargar canciones completas en MP3 a 320 kbps!"
            if has_ffmpeg
            else "FFmpeg no detectado. Revisa la guía para instalarlo con: winget install Gyan.FFmpeg"
        )
    })


@app.route("/api/search", methods=["POST"])
def search_song():
    """
    Busca la CANCIÓN COMPLETA en YouTube.
    Filtra los resultados para descartar vistas previas o YouTube Shorts cortos (< 60 segundos)
    y selecciona la versión completa oficial de la pista.
    """
    data = request.get_json() or {}
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"error": "La consulta no puede estar vacía"}), 400

    # Buscamos los primeros 5 resultados para elegir el que sea una canción completa
    search_query = f"ytsearch5:{query} official audio"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,  # Búsqueda rápida de metadatos sin descargar
        "skip_download": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(search_query, download=False)
            
            if not search_results or "entries" not in search_results or not search_results["entries"]:
                # Reintento con búsqueda estándar si no hubo coincidencia con 'official audio'
                search_results = ydl.extract_info(f"ytsearch3:{query}", download=False)

            entries = search_results.get("entries", [])
            if not entries:
                return jsonify({"error": f"No se encontraron canciones para: {query}"}), 404

            # Filtrar para encontrar una canción completa (más de 60 segundos)
            selected_video = None
            for entry in entries:
                if not entry:
                    continue
                dur = entry.get("duration") or 0
                # Descartar Shorts o clips de menos de 1 minuto si hay canciones completas disponibles
                if dur >= 60:
                    selected_video = entry
                    break

            # Si todas duraban menos o no tenían duración informada, tomar la primera
            if not selected_video and entries:
                selected_video = entries[0]

            duration = selected_video.get("duration") or 0
            mins = int(duration // 60)
            secs = int(duration % 60)
            duration_formatted = f"{mins}:{secs:02d}" if duration else "Completa"

            return jsonify({
                "id": selected_video.get("id"),
                "title": selected_video.get("title", query),
                "uploader": selected_video.get("uploader", "Artista"),
                "duration": duration,
                "duration_formatted": duration_formatted,
                "thumbnail": selected_video.get("thumbnail") or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
                "is_full_song": duration >= 60,
                "quality": "320 kbps (Máxima)",
            })
    except Exception as e:
        return jsonify({"error": f"Error al buscar en YouTube: {str(e)}"}), 500


@app.route("/api/download/<video_id>", methods=["GET"])
def download_mp3(video_id):
    """
    DESCARGA LA CANCIÓN COMPLETA:
    - Extrae el stream de audio original completo de YouTube de principio a fin.
    - Convierte el audio a formato MP3 con bitrate constante o variable de 320 kbps (máxima fidelidad).
    - Incrusta metadatos ID3 (título y artista).
    - Envía el archivo directamente como descarga al navegador del usuario.
    """
    if not video_id or len(video_id) < 5:
        return jsonify({"error": "ID de video inválido"}), 400

    video_url = f"https://www.youtube.com/watch?v={video_id}"
    target_mp3 = os.path.join(DOWNLOAD_DIR, f"{video_id}.mp3")

    # Configuración de yt-dlp para CANCIÓN COMPLETA y MÁXIMA CALIDAD (320 kbps)
    ydl_opts = {
        # bestaudio garantiza el audio original sin comprimir de YouTube
        "format": "bestaudio/best",
        "outtmpl": os.path.join(DOWNLOAD_DIR, f"{video_id}.%(ext)s"),
        "postprocessors": [
            {
                # Conversión directa con FFmpeg a MP3 a 320 kbps
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "320",
            },
            {
                # Añade metadatos ID3 al archivo MP3
                "key": "FFmpegMetadata",
                "add_metadata": True,
            }
        ],
        "quiet": False,
        "no_warnings": True,
        # Sin límites de tiempo: descarga el 100% de la pista
    }

    try:
        # Obtener título real del video para nombrar el archivo .mp3
        with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
            info = ydl.extract_info(video_url, download=False)
            raw_title = info.get("title", f"cancion_{video_id}")
            clean_title = sanitize_filename(raw_title)

        # Si no existe en la caché temporal, descargar y convertir
        if not os.path.exists(target_mp3):
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])

        if not os.path.exists(target_mp3):
            return jsonify({
                "error": "No se pudo generar el archivo MP3 completo. Verifica que FFmpeg esté instalado."
            }), 500

        # Enviar archivo MP3 completo al navegador del usuario
        return send_file(
            target_mp3,
            as_attachment=True,
            download_name=f"{clean_title}.mp3",
            mimetype="audio/mpeg"
        )
    except Exception as e:
        return jsonify({"error": f"Error al procesar la canción completa: {str(e)}"}), 500


if __name__ == "__main__":
    print("==================================================================")
    print("🎵 DESCARGADOR DE CANCIONES COMPLETAS (320 KBPS)")
    print("🚀 Servidor local activo en: http://localhost:5000")
    if check_ffmpeg_installed():
        print("✅ FFmpeg detectado correctamente (Audio 320 kbps habilitado)")
    else:
        print("⚠️ ADVERTENCIA: FFmpeg no detectado en PATH.")
        print("   Para convertir a MP3 completo instala FFmpeg con:")
        print("   Windows: winget install Gyan.FFmpeg")
        print("   Mac:     brew install ffmpeg")
        print("   Linux:   sudo apt install ffmpeg")
    print("==================================================================")
    app.run(host="0.0.0.0", port=5000, debug=True)
