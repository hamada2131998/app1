
export const logger = {
  error: (context: string, err: any) => {
    // في الإنتاج، يمكن إرسال هذه البيانات إلى Sentry أو أي خدمة خارجية
    console.error(`[App Error - ${context}]:`, {
      code: err?.code,
      message: err?.message,
      timestamp: new Date().toISOString()
    });
  },
  info: (context: string, message: string) => {
    // Fix: Cast import.meta to any to access Vite's env property and resolve TypeScript compilation error
    if ((import.meta as any).env.DEV) {
      console.log(`[App Info - ${context}]: ${message}`);
    }
  }
};