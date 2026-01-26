
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * يرسل تنبيهاً يظهر للمستخدم في أسفل الشاشة
 */
export const toast = {
  show: (message: string, type: ToastType = 'info', duration: number = 4000) => {
    const event = new CustomEvent<ToastEventDetail>('app-toast', {
      detail: { message, type, duration }
    });
    window.dispatchEvent(event);
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  info: (message: string) => toast.show(message, 'info'),
  warning: (message: string) => toast.show(message, 'warning'),
};
