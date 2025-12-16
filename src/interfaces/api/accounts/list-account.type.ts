import type { ApiResponse } from '../response-factory.type';
import type { WalletAccount } from '../../wallet-account.type';

export type ListAccountResponse = ApiResponse<WalletAccount[]>;
