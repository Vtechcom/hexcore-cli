import type { WalletAccount } from '../../wallet-account.type';
import type { ApiResponse } from '../response-factory.type';

type CreatedNode = {
    id: number;
    description: string;
    port: number;
    vkey: string;
    createdAt: string;
    status: 'ACTIVE' | 'INACTIVE';
    cardanoAccount: WalletAccount;
};

export type HydraNodeCreateResponse = ApiResponse<CreatedNode>;
