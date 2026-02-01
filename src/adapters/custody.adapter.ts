import {
  listCustodies,
  listCustodyTransactions,
  processCustodyTx,
  getMyCustodyBalance,
} from '@/services/custody.service';

export const getCustodies = listCustodies;

export const getCustodyTransactions = listCustodyTransactions;

export const createCustodyTransaction = processCustodyTx;

export { getMyCustodyBalance };
