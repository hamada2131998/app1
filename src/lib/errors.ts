
export interface NormalizedError {
  code: string;
  message: string;
  isAuthExpired: boolean;
  isPermissionDenied: boolean;
  isNetworkError: boolean;
  originalError: any;
}

const ERROR_MAPPINGS: Record<string, string> = {
  'PGRST301': 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.',
  '42501': 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
  '23505': 'هذا السجل موجود بالفعل (تكرار بيانات).',
  'PGRST116': 'السجل المطلوب غير موجود.',
  'JWT_EXPIRED': 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول.',
  'NETWORK_ERROR': 'تعذر الاتصال بالإنترنت، يرجى التحقق من الشبكة.',
  'INSUFFICIENT_BALANCE': 'الرصيد غير كافٍ لإتمام هذه العملية.',
  'LOCKED_PERIOD': 'التاريخ المختار يقع ضمن فترة محاسبية مقفولة.',
  'INVALID_CREDENTIALS': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
};

export function normalizeError(err: any): NormalizedError {
  const code = err?.code || (err?.message?.includes('JWT') ? 'PGRST301' : 'UNKNOWN');
  const message = err?.message || '';
  
  let translatedMessage = ERROR_MAPPINGS[code] || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';

  // معالجة الرسائل النصية القادمة من RPC
  if (message.includes('Insufficient')) translatedMessage = ERROR_MAPPINGS['INSUFFICIENT_BALANCE'];
  if (message.includes('Locked')) translatedMessage = ERROR_MAPPINGS['LOCKED_PERIOD'];
  if (message.includes('Invalid login')) translatedMessage = ERROR_MAPPINGS['INVALID_CREDENTIALS'];
  if (message.includes('Failed to fetch')) translatedMessage = ERROR_MAPPINGS['NETWORK_ERROR'];

  return {
    code,
    message: translatedMessage,
    isAuthExpired: code === 'PGRST301' || message.includes('JWT'),
    isPermissionDenied: code === '42501',
    isNetworkError: message.includes('Failed to fetch'),
    originalError: err
  };
}
