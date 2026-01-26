
import { getSupabase } from '../lib/supabase';
import { MovementAttachment } from '../types';

/**
 * جلب قائمة المرفقات الخاصة بحركة مالية معينة
 */
export async function listMovementAttachments(movementId: string): Promise<MovementAttachment[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('movement_attachments')
    .select(`
      *,
      uploader:profiles!movement_attachments_uploaded_by_fkey(id, full_name)
    `)
    .eq('movement_id', movementId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data as unknown as MovementAttachment[];
}

/**
 * رفع ملف جديد وربطه بحركة مالية مع الامتثال لـ Path Convention:
 * company_id/movement_id/timestamp_filename
 */
export async function uploadMovementAttachment(movementId: string, companyId: string, file: File): Promise<MovementAttachment> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  // 1. التحقق من الحجم (الحد الأقصى 10 ميجابايت)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("حجم الملف كبير جداً، الحد الأقصى 10 ميجابايت");
  }

  // 2. التحقق من الامتدادات المسموحة
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    throw new Error("نوع الملف غير مسموح به. المسموح: PDF, JPG, PNG");
  }

  // 3. بناء المسار (Path Convention)
  const safeFileName = file.name.replace(/[^\w.-]/g, '_');
  const storagePath = `${companyId}/${movementId}/${Date.now()}_${safeFileName}`;

  // 4. الرفع إلى Storage (الرفع الفعلي)
  const { error: uploadError } = await client.storage
    .from('attachments')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    throw new Error(`فشل رفع الملف إلى التخزين: ${uploadError.message}`);
  }

  // 5. تسجيل Metadata في قاعدة البيانات
  const { data: attachment, error: dbError } = await client
    .from('movement_attachments')
    .insert([{
      movement_id: movementId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size
    }])
    .select()
    .single();

  if (dbError) {
    // محاولة تنظيف الملف في حال فشل تسجيله في القاعدة لضمان النزاهة
    await client.storage.from('attachments').remove([storagePath]);
    throw new Error(`فشل تسجيل بيانات المرفق في النظام: ${dbError.message}`);
  }

  return attachment as MovementAttachment;
}

/**
 * توليد رابط مؤقت (Signed URL) صالح لمدة 10 دقائق لمشاهدة المرفق
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.storage
    .from('attachments')
    .createSignedUrl(storagePath, 600); // 10 دقائق (600 ثانية)

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("فشل في توليد رابط الوصول للملف");
  
  return data.signedUrl;
}

/**
 * حذف مرفق من التخزين وقاعدة البيانات
 */
export async function deleteAttachment(id: string, storagePath: string) {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  // حذف من التخزين أولاً
  const { error: storageError } = await client.storage
    .from('attachments')
    .remove([storagePath]);
  
  if (storageError) throw storageError;

  // حذف من قاعدة البيانات
  const { error: dbError } = await client
    .from('movement_attachments')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
}
