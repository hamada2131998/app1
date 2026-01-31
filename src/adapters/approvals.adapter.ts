import { listPendingMovements, processApproval } from '@/services/approvals.service';

export const listPendingApprovals = listPendingMovements;

export const actOnApproval = processApproval;
