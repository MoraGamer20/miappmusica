import React, { useState } from 'react';
import {
  X,
  Globe,
  Github,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  Cloud,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitSteps = [
    {
      title: 'Paso 1: Guardar cambios y subir a GitHub',
      desc: 'Ejecuta estos comandos en tu terminal local dentro de la carpeta del proyecto:',
      command: 'git add .\ngit commit -m "Deezer Library Hub - Lista para Vercel"\ngit push origin main',
    },
    {
      title: 'Paso 2: Conectar e Importar en Vercel',
      desc: 'Ve a vercel.com con tu cuenta de GitHub, pulsa "Add New..." -> "Project" y selecciona tu repositorio (MoraGamer20/miappmusica).',
      command: 'https://vercel.com/new',
      isLink: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-black via-slate-900 to-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 1155 1000">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Guía de Despliegue en Vercel</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  100% Configurado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sube tu app a GitHub y publícala gratis en Vercel con un dominio web público
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">
              ¡Tu proyecto ya incluye los archivos de configuración listos para Vercel!
            </p>
            <p className="text-slate-400">
              Hemos incluido <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">vercel.json</code> con
              las reglas de rewrite SPA y la función serverless en <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">/api/full-audio/search.js</code> para que funcione en vivo sin configurar nada extra.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-5 space-y-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Github className="w-4 h-4 text-purple-400" />
                1. Subir cambios a tu repositorio de GitHub
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'git add .\ngit commit -m "Deezer Library Hub - Lista para Vercel"\ngit push origin main',
                    1
                  )
                }
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? 'Copiado' : 'Copiar comandos'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Abre la terminal en tu computadora o en GitHub y ejecuta:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
              git add .<br />
              git commit -m "Deezer Library Hub - Lista para Vercel"<br />
              git push origin main
            </pre>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                2. Importar tu repositorio en Vercel
              </span>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Abrir Vercel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              1. En el panel de Vercel, haz clic en <strong className="text-white">Add New...</strong> &rarr; <strong className="text-white">Project</strong>.
            </p>
            <p className="text-xs text-slate-400">
              2. Concede acceso a tu cuenta de GitHub y selecciona tu repositorio (<strong className="text-purple-300">miappmusica</strong>).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              3. Parámetros de compilación (Detectados automáticamente)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
                <p className="text-[10px] text-slate-500 uppercase">Framework</p>
                <p className="font-semibold text-white">Vite</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
                <p className="text-[10px] text-slate-500 uppercase">Build Command</p>
                <p className="font-semibold text-white">npm run build</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
                <p className="text-[10px] text-slate-500 uppercase">Output Directory</p>
                <p className="font-semibold text-white">dist</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Haz clic en <strong className="text-emerald-400">Deploy</strong>. En menos de un minuto tu app estará en línea con HTTPS y certificado SSL gratuito.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Compatible con GitHub Pages, Netlify y Cloudflare Pages también.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
