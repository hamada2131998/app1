import { supabase, requireCompanyId } from './supabaseUtils';
import type { MovementAttachmentRow } from '@/types/db';

export async function uploadMovementReceipt(params: {
  company_id: string;
  movement_id: string;
  file: File;
}): Promise<MovementAttachmentRow> {
  const cId = requireCompanyId(params.company_id);
  const fileExt = params.file.name.split('.').pop() || 'jpg';
  const filePath = `${cId}/movements/${params.movement_id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('expense-receipts')
    .upload(filePath, params.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: params.file.type,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('movement_attachments')
    .insert({
      company_id: cId,
      movement_id: params.movement_id,
      storage_path: filePath,
      file_name: params.file.name,
      mime_type: params.file.type,
      file_size: params.file.size,
    })
    .select('id, company_id, movement_id, storage_path, file_name, mime_type, file_size')
    .single();

  if (error) throw error;
  return data as MovementAttachmentRow;
}

export async function getReceiptSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('expense-receipts').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
