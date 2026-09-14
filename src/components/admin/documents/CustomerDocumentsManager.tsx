'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  User,
  Download,
} from 'lucide-react';
import { AdminSession, CustomerDocument, CustomerDocumentType } from '@/lib/mock/types';
import { getCustomerDocuments, uploadCustomerDocument, deleteCustomerDocument } from '@/lib/dal/documents';
import { mockStore } from '@/lib/mock/store';

interface CustomerDocumentsManagerProps {
  session: AdminSession;
  customerId: string;
  bookingId?: string;
  customerName: string;
  membershipNo?: string;
  readOnly?: boolean;
}

export default function CustomerDocumentsManager({
  session,
  customerId,
  bookingId,
  customerName,
  membershipNo = '',
  readOnly = false,
}: CustomerDocumentsManagerProps) {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docType, setDocType] = useState<CustomerDocumentType>('applicant_photo');
  const [docLabel, setDocLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<CustomerDocument | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canUpload = !readOnly && (session.role === 'super_admin' || Boolean(session.permissions?.can_create_customer));

  const loadDocs = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await getCustomerDocuments(session, customerId);
      if (res.ok) {
        setDocuments(res.documents);
      } else {
        setActionError(res.message || 'Failed to load customer documents.');
      }
    } catch {
      setActionError('An error occurred while loading documents.');
    } finally {
      setLoading(false);
    }
  }, [customerId, session]);

  useEffect(() => {
    loadDocs();
    const unsub = mockStore.onBroadcast((event) => {
      if (
        (event.type === 'DOCUMENT_UPLOADED' || event.type === 'DOCUMENT_DELETED') &&
        event.customerId === customerId
      ) {
        loadDocs();
      }
    });
    return unsub;
  }, [loadDocs, customerId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Only JPEG, PNG, WEBP, and PDF documents are allowed.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Document size must not exceed 15 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    if (docType === 'other' && !docLabel.trim()) {
      setUploadError('Please specify a label or description for this document.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadCustomerDocument(session, {
        customerId,
        bookingId,
        file: selectedFile,
        type: docType,
        label: docType === 'other' ? docLabel.trim() : undefined,
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setDocLabel('');
        setDocType('applicant_photo');
        setActionSuccess(`Document "${res.document?.fileName}" uploaded successfully.`);
        setTimeout(() => setActionSuccess(null), 4000);
        await loadDocs();
      } else {
        setUploadError(res.message || 'Failed to upload document.');
      }
    } catch {
      setUploadError('An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to permanently delete this attached document?')) {
      return;
    }

    setDeletingId(docId);
    setActionError(null);

    try {
      const res = await deleteCustomerDocument(session, docId);
      if (res.ok) {
        setActionSuccess('Document deleted successfully.');
        setTimeout(() => setActionSuccess(null), 4000);
        await loadDocs();
      } else {
        setActionError(res.message || 'Failed to delete document.');
      }
    } catch {
      setActionError('An unexpected error occurred while deleting document.');
    } finally {
      setDeletingId(null);
    }
  };

  const getDocTypeBadge = (doc: CustomerDocument) => {
    switch (doc.type) {
      case 'applicant_photo':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Applicant Photo</span>;
      case 'cnic_copy':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">CNIC Copy</span>;
      case 'nok_cnic_copy':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Next of Kin CNIC</span>;
      case 'other':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">{doc.label || 'Other Attachment'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Physical Booking Documents & Paperwork</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official attached paperwork, CNIC scans, applicant photographs, and affidavits for Member{' '}
            <strong className="text-slate-700">{customerName}</strong> ({membershipNo}).
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document Scan</span>
          </button>
        )}
      </div>

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading attached documents...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">No documents uploaded yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Attach physical paper forms, CNIC copies, photographs, or official receipts for this customer record.
          </p>
          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-800 font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Attach First Document</span>
            </button>
          )}
        </div>
      ) : (
        /* Documents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
            const isImage = !isPdf;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Visual Thumbnail */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="h-36 bg-slate-100 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-slate-100"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-rose-600">
                      <FileCheck className="w-10 h-10" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">PDF Document</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> View Full
                    </span>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getDocTypeBadge(doc)}
                      <span className="text-[10px] font-mono font-medium text-slate-400">{doc.fileSizeKb} KB</span>
                    </div>
                    <h5
                      className="text-xs font-bold text-slate-900 truncate mb-1 cursor-pointer hover:text-emerald-700"
                      title={doc.fileName}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {doc.fileName}
                    </h5>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 truncate" title={doc.uploadedByUserName || 'Admin'}>
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.uploadedByUserName || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-700 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Attach Customer Document</h4>
                  <p className="text-[11px] text-slate-500">Attach scan or PDF to member file</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Document Type Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as CustomerDocumentType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="applicant_photo">Applicant Photograph Scan</option>
                  <option value="cnic_copy">Applicant CNIC Copy Scan</option>
                  <option value="nok_cnic_copy">Next of Kin CNIC Copy Scan</option>
                  <option value="other">Other Paperwork / Document Attachment</option>
                </select>
              </div>

              {/* Freeform Label (Required when Other) */}
              {docType === 'other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Label / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Affidavit Stamp Paper, Bank Guarantee"
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select File (JPEG, PNG, WEBP, or PDF up to 15MB)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-emerald-500 transition-colors bg-slate-50/50">
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center text-slate-400">
                      {selectedFile ? (
                        <FileCheck className="w-10 h-10 text-emerald-600" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      <label
                        htmlFor="doc-file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-semibold text-emerald-700 hover:text-emerald-800 focus-within:outline-hidden"
                      >
                        <span>{selectedFile ? 'Change selected file' : 'Click to browse scan file'}</span>
                        <input
                          id="doc-file-upload"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    {selectedFile ? (
                      <p className="text-xs font-bold text-slate-800">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Images are auto-compressed; PDFs stored uncompressed</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Compressing & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Attach</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-white truncate max-w-md">{previewDoc.fileName}</h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded {new Date(previewDoc.uploadedAt).toLocaleDateString()} by {previewDoc.uploadedByUserName || 'Admin'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-4 bg-slate-950/95 flex-1 overflow-auto flex items-center justify-center min-h-[360px]">
              {previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[540px] rounded-xl border border-white/10"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[540px] max-w-full object-contain rounded-xl shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
