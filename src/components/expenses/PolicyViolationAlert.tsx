// =====================================================
// POLICY VIOLATION ALERT COMPONENT
// Displays policy violations and approval requirements
// =====================================================

import { AlertTriangle, Shield, Info, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { PolicyViolation, PolicyEvaluationResult } from '@/data/policyEngine';
import { motion } from 'framer-motion';

interface PolicyViolationAlertProps {
  result: PolicyEvaluationResult;
  onClose?: () => void;
}

export function PolicyViolationAlert({ result, onClose }: PolicyViolationAlertProps) {
  if (result.passed && result.violations.length === 0) {
    return null;
  }

  const hasBlocker = result.violations.some(v => v.action === 'block');
  const hasWarning = result.violations.some(v => v.action === 'warn');
  const hasApproval = result.violations.some(v => v.action === 'require_approval');

  const getAlertVariant = () => {
    if (hasBlocker) return 'destructive';
    if (hasApproval) return 'default';
    return 'default';
  };

  const getIcon = () => {
    if (hasBlocker) return <XCircle className="w-5 h-5" />;
    if (hasApproval) return <Shield className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getTitle = () => {
    if (hasBlocker) return '⛔ تم حظر الإرسال';
    if (hasApproval) return '🔐 يتطلب موافقة إضافية';
    return '⚠️ تنبيهات السياسة';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Alert 
        variant={getAlertVariant()} 
        className={`
          ${hasBlocker ? 'bg-destructive/10 border-destructive/50' : ''}
          ${hasApproval && !hasBlocker ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : ''}
          ${hasWarning && !hasBlocker && !hasApproval ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' : ''}
        `}
      >
        {getIcon()}
        <AlertTitle className="flex items-center justify-between">
          <span>{getTitle()}</span>
          <Badge 
            variant="outline" 
            className={`text-xs ${hasBlocker ? 'border-destructive text-destructive' : 'border-amber-500 text-amber-600'}`}
          >
            Policy Engine
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-3 mt-2">
            {result.violations.map((violation, index) => (
              <ViolationItem key={violation.rule_id || index} violation={violation} />
            ))}

            {hasApproval && !hasBlocker && (
              <div className="mt-4 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      سيتم إرسال الطلب لموافقة المدير
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {result.approvalReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasBlocker && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive font-medium">
                  لا يمكن إرسال هذا المصروف. يرجى تعديل القيم أو التواصل مع الإدارة المالية.
                </p>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

function ViolationItem({ violation }: { violation: PolicyViolation }) {
  const getActionStyle = () => {
    switch (violation.action) {
      case 'block':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'require_approval':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-700';
      case 'warn':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    }
  };

  const getActionLabel = () => {
    switch (violation.action) {
      case 'block': return 'حظر';
      case 'require_approval': return 'يتطلب موافقة';
      case 'warn': return 'تحذير';
      default: return violation.action;
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getActionStyle()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-sm">{violation.message_ar}</p>
          {violation.expected_value && violation.actual_value && (
            <p className="text-xs mt-1 opacity-80">
              القيمة المسموحة: {String(violation.expected_value)} | القيمة المدخلة: {String(violation.actual_value)}
            </p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {getActionLabel()}
        </Badge>
      </div>
    </div>
  );
}
