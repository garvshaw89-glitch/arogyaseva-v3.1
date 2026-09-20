import React, { useState, useRef } from "react";
import { CaseAttachment } from "../../types";
import { useRealtime } from "../../context/RealtimeContext";
import {
  FileText,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Activity,
  Check,
  Eye,
  Trash2,
  X,
  FilePlus2,
  Download,
} from "lucide-react";

interface CaseAttachmentsManagerProps {
  caseId: string;
  attachments?: CaseAttachment[];
  readOnly?: boolean;
  className?: string;
}

export const CaseAttachmentsManager: React.FC<CaseAttachmentsManagerProps> = ({
  caseId,
  attachments = [],
  readOnly = false,
  className = "",
}) => {
  const { addAttachment, deviceName } = useRealtime();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<CaseAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const isImg = file.type.startsWith("image/");
      await addAttachment(caseId, {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        dataUrl,
        category: isImg ? "photo" : file.name.toLowerCase().includes("ecg") ? "ecg_trace" : "lab_report",
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachPreset = async (type: "ecg" | "lab" | "photo") => {
    setIsUploading(true);
    try {
      if (type === "ecg") {
        await addAttachment(caseId, {
          fileName: `Lead-II_Rhythm_Trace_${Date.now().toString().slice(-4)}.pdf`,
          fileType: "application/pdf",
          fileSize: 184500,
          category: "ecg_trace",
        });
      } else if (type === "lab") {
        await addAttachment(caseId, {
          fileName: `PointOfCare_CBC_BloodSugar_${Date.now().toString().slice(-4)}.pdf`,
          fileType: "application/pdf",
          fileSize: 94200,
          category: "lab_report",
        });
      } else {
        await addAttachment(caseId, {
          fileName: `Clinical_Lesion_Photo_${Date.now().toString().slice(-4)}.jpg`,
          fileType: "image/jpeg",
          fileSize: 312000,
          category: "photo",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "ecg_trace":
        return { label: "ECG Trace", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "photo":
        return { label: "Clinical Photo", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "prescription":
        return { label: "Rx Prescription", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "lab_report":
      default:
        return { label: "Lab Diagnostic", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-teal-600" />
          <h4 className="text-xs font-bold text-slate-800">
            Clinical Attachments & Diagnostics ({attachments.length})
          </h4>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3 text-teal-600" />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Attachment Quick Presets */}
      {!readOnly && (
        <div className="mb-3 flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
          <span className="text-slate-400 font-semibold self-center mr-1">Quick Sample:</span>
          <button
            type="button"
            onClick={() => handleAttachPreset("ecg")}
            disabled={isUploading}
            className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 border border-slate-200 text-rose-800 font-semibold text-[10px] transition-colors"
          >
            + 12-Lead ECG
          </button>
          <button
            type="button"
            onClick={() => handleAttachPreset("lab")}
            disabled={isUploading}
            className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-800 font-semibold text-[10px] transition-colors"
          >
            + CBC / Sugar Lab
          </button>
          <button
            type="button"
            onClick={() => handleAttachPreset("photo")}
            disabled={isUploading}
            className="px-2 py-0.5 rounded bg-white hover:bg-purple-50 border border-slate-200 text-purple-800 font-semibold text-[10px] transition-colors"
          >
            + Clinical Photo
          </button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="py-5 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
          No diagnostic files or ECG traces attached yet. Upload or select a quick sample to sync across devices.
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const badge = getCategoryBadge(att.category);
            return (
              <div
                key={att.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                    {att.category === "photo" ? (
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                    ) : att.category === "ecg_trace" ? (
                      <Activity className="w-4 h-4 text-rose-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{att.fileName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className={`px-1.5 py-0.2 rounded border font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span>{formatFileSize(att.fileSize)}</span>
                      <span>•</span>
                      <span>by {att.uploadedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {att.dataUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedPreview(att)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors"
                      title="Preview Attachment"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {att.dataUrl && (
                    <a
                      href={att.dataUrl}
                      download={att.fileName}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors"
                      title="Download Attachment"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">{selectedPreview.fileName}</h4>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-lg p-2">
              {selectedPreview.fileType.startsWith("image/") && selectedPreview.dataUrl ? (
                <img
                  src={selectedPreview.dataUrl}
                  alt={selectedPreview.fileName}
                  className="max-h-[55vh] max-w-full rounded object-contain"
                />
              ) : (
                <div className="py-12 text-center text-slate-600 text-xs">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="font-bold">{selectedPreview.fileName}</p>
                  <p className="text-slate-400 mt-1">{formatFileSize(selectedPreview.fileSize)}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
