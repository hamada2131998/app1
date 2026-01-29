// =====================================================
// SYSTEM LOGS PAGE - AUDIT TRAIL UI
// Displays immutable audit logs for the current tenant
// =====================================================

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/contexts/TenantContext';
import { 
  getAuditLogs, 
  AUDIT_ACTION_LABELS, 
  ENTITY_TYPE_LABELS,
  type AuditLog,
  type AuditAction 
} from '@/data/auditLogs';
import { 
  Shield, 
  Search, 
  Filter, 
  FileDown, 
  Clock, 
  User, 
  Globe, 
  Monitor,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SystemLogs() {
  const { currentCompany } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const auditLogs = useMemo(() => {
    return getAuditLogs(currentCompany.id);
  }, [currentCompany.id]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          log.changes_summary.toLowerCase().includes(query) ||
          log.user_name.toLowerCase().includes(query) ||
          log.user_email.toLowerCase().includes(query) ||
          log.entity_name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // Entity filter
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, actionFilter, entityFilter]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const uniqueActions = [...new Set(auditLogs.map(l => l.action))];
  const uniqueEntities = [...new Set(auditLogs.map(l => l.entity_type))];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              سجل النظام
            </h1>
            <p className="text-muted-foreground">
              سجل تدقيق غير قابل للتعديل لجميع العمليات المالية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-primary border-primary">
              <Lock className="w-3 h-3" />
              Immutable Audit Trail
            </Badge>
            <Button variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              تصدير السجل
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">سجل التدقيق المحمي</h4>
                <p className="text-sm text-muted-foreground">
                  هذا السجل محمي بواسطة Database Triggers. لا يمكن تعديل أو حذف أي سجل بعد إنشائه.
                  يتم تسجيل كل عملية مالية تلقائياً مع بيانات المستخدم والوقت والموقع.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في السجلات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {AUDIT_ACTION_LABELS[action as AuditAction]?.ar || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="نوع الكيان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الكيانات</SelectItem>
                  {uniqueEntities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {ENTITY_TYPE_LABELS[entity]?.ar || entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-sm">
                {filteredLogs.length} سجل
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجلات التدقيق</CardTitle>
            <CardDescription>
              عرض {filteredLogs.length} من {auditLogs.length} سجل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد سجلات مطابقة للبحث</p>
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <div 
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Action Badge */}
                              <Badge 
                                className={`${AUDIT_ACTION_LABELS[log.action]?.color || 'bg-gray-100 text-gray-800'} shrink-0`}
                              >
                                {AUDIT_ACTION_LABELS[log.action]?.ar || log.action}
                              </Badge>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">
                                  {log.changes_summary}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {log.user_name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(log.created_at)}
                                  </span>
                                  {log.entity_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {ENTITY_TYPE_LABELS[log.entity_type]?.ar || log.entity_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expand Icon */}
                            <Button variant="ghost" size="icon" className="shrink-0">
                              {expandedLogId === log.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedLogId === log.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <Separator className="my-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {/* Metadata */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-foreground">معلومات العملية</h5>
                                    <div className="space-y-1 text-muted-foreground">
                                      <p className="flex items-center gap-2">
                                        <Globe className="w-3 h-3" />
                                        IP: <code className="text-xs bg-muted px-1 rounded">{log.ip_address}</code>
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <Monitor className="w-3 h-3" />
                                        <span className="truncate max-w-[250px]" title={log.user_agent}>
                                          {log.user_agent.substring(0, 50)}...
                                        </span>
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(log.created_at)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Values Changed */}
                                  {(log.old_values || log.new_values) && (
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-foreground">التغييرات</h5>
                                      <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                                        {log.old_values && (
                                          <div className="text-red-600 dark:text-red-400">
                                            - {JSON.stringify(log.old_values)}
                                          </div>
                                        )}
                                        {log.new_values && (
                                          <div className="text-green-600 dark:text-green-400">
                                            + {JSON.stringify(log.new_values)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Entity Reference */}
                                {log.entity_name && (
                                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                                    <p className="text-sm">
                                      <span className="text-muted-foreground">الكيان المتأثر: </span>
                                      <span className="font-medium">{log.entity_name}</span>
                                      <code className="text-xs bg-muted px-1 mx-2 rounded">{log.entity_id}</code>
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
