import {
  listCustodies,
  listCustodyTransactions,
  processCustodyTx,
} from '@/services/custody.service';

export const getCustodies = listCustodies;

export const getCustodyTransactions = listCustodyTransactions;

export const createCustodyTransaction = processCustodyTx;
