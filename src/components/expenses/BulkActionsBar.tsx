import { CheckCircle, XCircle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onSettle: () => void;
  onClear: () => void;
  showSettle?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onApprove,
  onReject,
  onSettle,
  onClear,
  showSettle = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-elevated">
          <div className="flex items-center gap-2 pl-4 border-l border-border">
            <span className="text-lg font-bold text-primary">{selectedCount}</span>
            <span className="text-sm text-muted-foreground">عنصر محدد</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onApprove}
              className="bg-success hover:bg-success/90 text-success-foreground gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              موافقة جماعية
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              رفض جماعي
            </Button>

            {showSettle && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSettle}
                className="gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <CreditCard className="w-4 h-4" />
                تسوية جماعية
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
