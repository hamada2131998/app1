// Notifications system - in-app and email notification logic

export type NotificationType = 
  | 'expense_created'
  | 'expense_approved'
  | 'expense_rejected'
  | 'expense_settled'
  | 'transfer_received'
  | 'budget_warning'
  | 'role_changed'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  icon?: string;
  user_id: string;
  metadata?: Record<string, any>;
}

// Mock notifications store
let NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'expense_approved',
    title: 'تمت الموافقة على المصروف',
    message: 'تم اعتماد طلب صرف "شراء مواد بناء" بمبلغ 51,750 ريال',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    link: '/expenses',
    user_id: 'mock-user-001',
  },
  {
    id: 'notif-002',
    type: 'transfer_received',
    title: 'تحويل جديد',
    message: 'استلمت تحويل بمبلغ 5,000 ريال من محمد القحطاني',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    link: '/wallet',
    user_id: 'mock-user-001',
  },
  {
    id: 'notif-003',
    type: 'budget_warning',
    title: 'تحذير الميزانية',
    message: 'مشروع "برج الرياض التجاري" تجاوز 70% من الميزانية المخصصة',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    link: '/projects',
    user_id: 'mock-user-001',
  },
  {
    id: 'notif-004',
    type: 'expense_rejected',
    title: 'تم رفض المصروف',
    message: 'تم رفض طلب صرف "استشارات هندسية" - السبب: تجاوز الميزانية',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    read: true,
    link: '/expenses',
    user_id: 'mock-user-001',
  },
];

export function getNotifications(userId: string): Notification[] {
  return NOTIFICATIONS.filter(n => n.user_id === userId);
}

export function getUnreadCount(userId: string): number {
  return NOTIFICATIONS.filter(n => n.user_id === userId && !n.read).length;
}

export function markAsRead(notificationId: string): void {
  NOTIFICATIONS = NOTIFICATIONS.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
}

export function markAllAsRead(userId: string): void {
  NOTIFICATIONS = NOTIFICATIONS.map(n => 
    n.user_id === userId ? { ...n, read: true } : n
  );
}

export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: 'notif-' + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  NOTIFICATIONS = [newNotification, ...NOTIFICATIONS];
  return newNotification;
}

// Email notification simulation (in production, this would call an edge function)
export interface EmailNotificationPayload {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

export function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  console.log('[Email Notification]', payload);
  // In production, this would call supabase.functions.invoke('send-email', { body: payload })
  return Promise.resolve(true);
}

// Helper to create expense notifications
export function notifyExpenseAction(
  action: 'created' | 'approved' | 'rejected' | 'settled',
  expenseDescription: string,
  amount: number,
  userId: string,
  recipientId?: string,
  rejectionReason?: string
): void {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);

  const titles: Record<string, string> = {
    created: 'طلب صرف جديد',
    approved: 'تمت الموافقة على المصروف',
    rejected: 'تم رفض المصروف',
    settled: 'تمت تسوية المصروف',
  };

  const messages: Record<string, string> = {
    created: `تم إنشاء طلب صرف "${expenseDescription}" بمبلغ ${formatCurrency(amount)}`,
    approved: `تم اعتماد طلب صرف "${expenseDescription}" بمبلغ ${formatCurrency(amount)}`,
    rejected: `تم رفض طلب صرف "${expenseDescription}"${rejectionReason ? ` - السبب: ${rejectionReason}` : ''}`,
    settled: `تمت تسوية المصروف "${expenseDescription}" بمبلغ ${formatCurrency(amount)}`,
  };

  addNotification({
    type: `expense_${action}` as NotificationType,
    title: titles[action],
    message: messages[action],
    link: '/expenses',
    user_id: recipientId || userId,
  });
}
