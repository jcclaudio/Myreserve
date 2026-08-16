"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  ClipboardPaste,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  label?: string;
  helperText?: string;
  compact?: boolean;
}

export default function ImageUploadDropzone({
  value,
  onChange,
  label = "Foto / Print dos Trechos e Horários do Voo",
  helperText = "Cole um print (Ctrl+V), arraste uma imagem ou selecione do computador",
  compact = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Redimensiona e otimiza a imagem em Base64 para garantir carregamento instantâneo e impressão nítida no PDF
  function processarArquivoImagem(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          onChange(optimizedDataUrl);
        } else {
          onChange(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  // Tratamento de Paste (Ctrl+V)
  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processarArquivoImagem(file);
          return;
        }
      }
    }
  }

  // Botão explícito para colar da área de transferência
  async function handleColarClipboard() {
    try {
      if (!navigator.clipboard?.read) {
        alert("Dica: Clique no quadro e pressione Ctrl+V para colar a imagem copiada.");
        dropzoneRef.current?.focus();
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "print-clipboard.png", { type: imageType });
          processarArquivoImagem(file);
          return;
        }
      }
      alert("Nenhuma imagem encontrada na sua área de transferência. Tire um print (PrintScreen ou Win+Shift+S) e tente novamente.");
    } catch {
      alert("Para colar, clique dentro do quadro abaixo e aperte Ctrl+V.");
      dropzoneRef.current?.focus();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivoImagem(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivoImagem(e.target.files[0]);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
          <ImageIcon className="h-3 w-3 text-brand-700" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-slate-500 hover:text-brand-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="h-2.5 w-2.5" />
          {showUrlInput ? "Ocultar link" : "Usar link URL"}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <input
            type="url"
            placeholder="https://exemplo.com/foto-voo.jpg"
            value={urlDraft || (value?.startsWith("http") ? value : "")}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus:border-brand-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (urlDraft.trim()) {
                onChange(urlDraft.trim());
                setUrlDraft("");
                setShowUrlInput(false);
              }
            }}
            className="px-2.5 py-1 bg-brand-900 text-white rounded-md text-xs font-bold hover:bg-brand-800"
          >
            Aplicar
          </button>
        </div>
      )}

      {value ? (
        /* PREVIEW DA IMAGEM CARREGADA */
        <div className={`relative rounded-xl border border-brand-300 bg-brand-50/20 transition-all ${
          compact ? "p-2.5" : "p-3.5"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs flex-shrink-0 flex items-center justify-center ${
              compact ? "h-16 w-24" : "h-24 w-36"
            }`}>
              <img
                src={value}
                alt="Imagem carregada"
                className="h-full w-full object-contain bg-slate-100"
              />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Imagem Pronta para o PDF</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1">
                Aparecerá com alta definição na proposta e no PDF.
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                >
                  <Upload className="h-2.5 w-2.5 text-slate-500" />
                  Trocar
                </button>

                <button
                  type="button"
                  onClick={handleColarClipboard}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded text-[11px] font-bold cursor-pointer"
                >
                  <ClipboardPaste className="h-2.5 w-2.5 text-amber-700" />
                  Colar Novo (Ctrl+V)
                </button>

                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold cursor-pointer"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Remover
                </button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        /* ÁREA DE DROP / PASTE (COMPACTA OU PADRÃO) */
        <div
          ref={dropzoneRef}
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border border-dashed transition-all cursor-pointer outline-none focus:ring-1 focus:ring-brand-900 ${
            compact ? "p-3" : "p-5"
          } ${
            isDragging
              ? "border-amber-500 bg-amber-50/50"
              : "border-slate-300 bg-slate-50/50 hover:border-brand-600 hover:bg-slate-50"
          }`}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName === "BUTTON") return;
            dropzoneRef.current?.focus();
          }}
        >
          {compact ? (
            /* LAYOUT COMPACTO EM LINHA */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200 text-brand-900 flex-shrink-0">
                  <Upload className="h-4 w-4 text-brand-800" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Cole o Print (Ctrl+V) ou envie arquivo
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    Clique aqui e tecle Ctrl+V ou selecione imagem
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleColarClipboard}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <ClipboardPaste className="h-3 w-3" />
                  Colar (Ctrl+V)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  <Upload className="h-3 w-3 text-slate-500" />
                  Arquivo
                </button>
              </div>
            </div>
          ) : (
            /* LAYOUT PADRÃO */
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-200 text-brand-900 mb-2">
                <Upload className="h-5 w-5 text-brand-800" />
              </div>

              <h4 className="text-xs font-extrabold text-slate-900 mb-0.5">
                Cole a foto aqui (Ctrl+V) ou faça Upload
              </h4>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto mb-3 leading-tight">
                {helperText}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleColarClipboard}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <ClipboardPaste className="h-3 w-3" />
                  Colar Imagem (Ctrl+V)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Upload className="h-3 w-3 text-slate-500" />
                  Escolher Arquivo
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
