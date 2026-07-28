/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AttachedFile } from '../types';
import { X, FileText, Download, ExternalLink, HelpCircle } from 'lucide-react';

interface FilePreviewModalProps {
  file: AttachedFile | null;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    // Open base64 in a new tab
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(
        `<iframe src="${file.dataUrl}" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      newTab.document.title = file.name;
    } else {
      alert("Le bloqueur de fenêtres pop-up a empêché l'ouverture dans un nouvel onglet. Veuillez autoriser les pop-ups ou télécharger le fichier directement.");
    }
  };

  const isPdf = file.type === 'application/pdf';

  return (
    <div id="file-preview-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-xs">
      <div id="file-preview-content" className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-amber-50 text-amber-600 flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <h3 className="font-black text-slate-800 text-xs truncate max-w-[300px] uppercase tracking-wide" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-semibold">
                {formatSize(file.size)} • {file.type || 'Inconnu'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 flex flex-col items-center justify-center min-h-[250px]">
          {isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* If browser supports direct base64 PDF rendering */}
              <iframe 
                src={file.dataUrl} 
                className="w-full h-[45vh] border border-slate-200 rounded-md shadow-3xs bg-white mb-3 hidden md:block"
                title="Aperçu PDF"
              />
              
              <div className="text-center p-4 bg-white border border-slate-200 rounded-md max-w-sm shadow-3xs">
                <FileText className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-xs text-slate-700 mb-1 uppercase tracking-wide">Aperçu du Document</h4>
                <p className="text-[11px] text-slate-500 mb-3 leading-tight">
                  Document correctement chargé. Ouvrez-le en plein écran pour une lecture optimale ou téléchargez-le localement.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Plein écran
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded shadow-3xs transition-colors cursor-pointer uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 p-4 bg-white border border-slate-200 rounded-md max-w-sm shadow-3xs">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-xs text-slate-700 mb-1 uppercase tracking-wide">Fichier non visualisable</h4>
              <p className="text-[11px] text-slate-500 mb-3 leading-tight">
                Format non pris en charge en direct, mais enregistré en toute sécurité. Téléchargez-le pour le consulter.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded shadow-3xs transition-colors cursor-pointer uppercase"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded shadow-3xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded shadow-3xs transition-colors cursor-pointer uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger le document
          </button>
        </div>

      </div>
    </div>
  );
}
