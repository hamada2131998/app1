import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Receipt, Wallet, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  type Notification 
} from '@/data/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'expense_created':
    case 'expense_approved':
    case 'expense_rejected':
    case 'expense_settled':
      return Receipt;
    case 'transfer_received':
      return Wallet;
    case 'budget_warning':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'expense_approved':
    case 'expense_settled':
      return 'text-emerald-400 bg-emerald-500/20';
    case 'expense_rejected':
      return 'text-red-400 bg-red-500/20';
    case 'budget_warning':
      return 'text-amber-400 bg-amber-500/20';
    case 'transfer_received':
      return 'text-violet-400 bg-violet-500/20';
    default:
      return 'text-blue-400 bg-blue-500/20';
  }
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'الآن';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  return date.toLocaleDateString('ar-SA');
};

export function NotificationCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      setNotifications(getNotifications(profile.id));
      setUnreadCount(getUnreadCount(profile.id));
    }
  }, [profile?.id, isOpen]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    setNotifications(getNotifications(profile?.id || ''));
    setUnreadCount(getUnreadCount(profile?.id || ''));
  };

  const handleMarkAllAsRead = () => {
    if (profile?.id) {
      markAllAsRead(profile.id);
      setNotifications(getNotifications(profile.id));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl"
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-gradient-to-r from-red-500 to-rose-600 border-2 border-[#0d1424]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0 bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl shadow-2xl shadow-violet-500/10"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">الإشعارات</h3>
            {unreadCount > 0 && (
              <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/30 text-xs">
                {unreadCount} جديد
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              <CheckCheck className="w-4 h-4 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-transparent hover:bg-white/[0.02]' 
                        : 'bg-violet-500/5 hover:bg-violet-500/10'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08]">
          <Button
            variant="ghost"
            className="w-full text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl"
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
          >
            إعدادات الإشعارات
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
