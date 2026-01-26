
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MovementStatus, MovementType, CashMovement, AuditLog, UserRole, MovementAttachment } from '../types';
import { getMovementById, getMovementAuditLogs } from '../services/movements.service';
import { listMovementAttachments, uploadMovementAttachment, getSignedUrl, deleteAttachment } from '../services/attachments.service';
import { processApproval } from '../services/approvals.service';
import { signOut } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../lib/errors';
import { logger } from '../lib/logger';
import { toast } from '../lib/toast';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { 
  ArrowRightIcon, 
  PrinterIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const MovementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { membership } = useAuth();

  const [movement, setMovement] = useState<CashMovement | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [attachments, setAttachments] = useState<MovementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comment, setComment] = useState('');

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [moveData, logsData, attachData] = await Promise.all([
        getMovementById(id),
        getMovementAuditLogs(id),
        listMovementAttachments(id)
      ]);
      setMovement(moveData);
      setLogs(logsData);
      setAttachments(attachData);
    } catch (err: any) {
      const normalized = normalizeError(err);
      if (normalized.isAuthExpired) {
        await signOut();
        navigate('/login');
      } else {
        setError(normalized.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!id || !movement) return;
    setActionLoading(true);
    try {
      await processApproval(id, action, comment);
      toast.success(action === 'APPROVED' ? "تم اعتماد السند بنجاح" : "تم رفض السند");
      setComment('');
      await fetchData();
    } catch (err: any) {
      toast.error(normalizeError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id || !movement || !membership) return;
    setUploading(true);
    try {
      const filesToUpload = Array.from(files) as File[];
      for (const file of filesToUpload) {
        await uploadMovementAttachment(id, movement.company_id, file);
      }
      toast.success("تم رفع المرفقات بنجاح");
      const updatedAttachments = await listMovementAttachments(id);
      setAttachments(updatedAttachments);
    } catch (err: any) {
      toast.error(normalizeError(err).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <Loader message="جاري جلب تفاصيل السند..." />;
  if (error || !movement) return <Alert type="error" message={error || "غير متاح"} />;

  const isLocked = movement.status === MovementStatus.APPROVED || movement.status === MovementStatus.REJECTED;
  const isAccountant = membership?.role === UserRole.OWNER || membership?.role === UserRole.ACCOUNTANT;
  const canApprove = isAccountant && movement.status === MovementStatus.SUBMITTED;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><ArrowRightIcon className="h-5 w-5" /></button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">سند مالي #{movement.id.slice(0, 8)}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                     <span className="text-6xl font-black text-gray-900">{movement.amount.toLocaleString()}</span>
                     <span className="text-xl font-black text-gray-300 mr-2 uppercase">ر.س</span>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                     <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">حالة السند</p>
                     <span data-testid="movement-status-badge" className="text-base font-black text-indigo-700">{movement.status}</span>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-10 border-t border-gray-50 pt-10">
                   <div><p className="text-[10px] text-gray-400 font-black mb-1 uppercase">التاريخ</p><p className="font-bold">{movement.movement_date}</p></div>
                   <div><p className="text-[10px] text-gray-400 font-black mb-1 uppercase">الخزنة</p><p className="font-bold">{movement.account?.name}</p></div>
                   <div><p className="text-[10px] text-gray-400 font-black mb-1 uppercase">التصنيف</p><p className="font-bold">{movement.category?.name}</p></div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="font-black text-xl flex items-center gap-3"><PaperClipIcon className="h-6 w-6" /> المرفقات</h3>
                {!isLocked && (
                   <div className="flex flex-col items-end gap-2">
                     <label className="cursor-pointer bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-lg">
                        إضافة مرفق
                        <input type="file" multiple className="hidden" data-testid="attachment-upload-input" onChange={handleFileUpload} disabled={uploading} />
                     </label>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <InformationCircleIcon className="h-3 w-3" />
                        الحد الأقصى للملف الواحد: 10MB
                     </p>
                   </div>
                )}
             </div>
             <div className="space-y-4" data-testid="attachment-list">
                {attachments.map(a => (
                   <div key={a.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                      <p className="text-sm font-bold" data-testid="attachment-item-name">{a.file_name}</p>
                      <button onClick={() => getSignedUrl(a.storage_path).then(url => window.open(url))} className="text-indigo-600 font-black text-xs">عرض</button>
                   </div>
                ))}
                {attachments.length === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                     <p className="text-gray-300 italic font-medium">لا توجد مرفقات لهذا السند.</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
           <h3 className="font-black text-xl mb-10 flex items-center gap-3"><ClockIcon className="h-6 w-6" /> سجل المراجعة</h3>
           <div className="space-y-8" data-testid="audit-log-list">
              {logs.map(log => (
                 <div key={log.id} className="border-r-2 border-indigo-100 pr-6 relative" data-testid="audit-log-item">
                    <p className="text-xs font-black">{log.action}</p>
                    <p className="text-[10px] text-gray-400">{log.actor?.full_name}</p>
                    {log.comment && <p className="text-[11px] bg-slate-50 p-2 rounded-lg mt-2 italic">"{log.comment}"</p>}
                 </div>
              ))}
           </div>
        </div>
      </div>

      {canApprove && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-2xl rounded-[3rem] px-12 py-8 flex gap-8 z-50 items-center w-full max-w-4xl animate-in slide-in-from-bottom-10 duration-500">
           <input className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl px-6 outline-none font-bold" data-testid="approval-comment-input" placeholder="ملاحظات المراجعة..." value={comment} onChange={e => setComment(e.target.value)} />
           <button data-testid="approve-action-btn" disabled={actionLoading} onClick={() => handleAction('APPROVED')} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">اعتماد السند</button>
        </div>
      )}
    </div>
  );
};

export default MovementDetail;
