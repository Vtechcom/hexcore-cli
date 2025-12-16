import axios, { AxiosInstance } from 'axios';
import type { ApiResponse } from '../interfaces/api/response-factory.type';
import type { HydraHead } from '../interfaces/api/hydra-nodes/hydra-heads.type';
import type { HydraNode } from '../interfaces/api/hydra-nodes/hydra-node.type';
import type { WalletAccount } from '../interfaces/wallet-account.type';
import { Converter, NETWORK_ID, ProviderUtils, UTxOObject } from '@hydra-sdk/core';

export interface ApiConfig {
    url: string;
    timeout?: number;
    username?: string;
    password?: string;
    blockfrostApiKey?: string;
}

export interface AuthResponse {
    data: {
        accessToken: string;
    };
    statusCode: number;
    message: string;
    status: string;
}

// Type aliases for backward compatibility
export type Head = HydraHead;
export type Node = HydraNode;
export type Account = WalletAccount;

export interface ActiveNode {
    hydraNodeId: string;
    hydraPartyId: string;
    container: {
        Id: string;
        Names: string[];
        Image: string;
        ImageID: string;
        Command: string;
        Created: number;
        Ports: Array<{
            IP: string;
            PrivatePort: number;
            PublicPort?: number;
            Type: string;
        }>;
        Labels: Record<string, string>;
        State: string;
        Status: string;
        HostConfig: { NetworkMode?: string };
        NetworkSettings: {
            Networks: Record<
                string,
                {
                    IPAMConfig: any;
                    Links?: any;
                    Aliases?: any;
                    NetworkID: string;
                    EndpointID: string;
                    Gateway: string;
                    IPAddress: string;
                    IPPrefixLen: number;
                    IPv6Gateway?: string;
                    GlobalIPv6Address?: string;
                    GlobalIPv6PrefixLen?: number;
                    MacAddress?: string;
                    DriverOpts?: any;
                }
            >;
        };
        Mounts: Array<{
            Type: string;
            Source: string;
            Destination: string;
            Mode?: string;
            RW?: boolean;
            Propagation?: string;
        }>;
    };
    isActive: boolean;
}

export interface SystemStatus {
    runningNodes: number;
    runningHeads: number;
    totalHeads: number;
    status: 'healthy' | 'error';
}

export class ApiClient {
    private client: AxiosInstance;
    private config: ApiConfig;
    private baseUrl: string;
    private accessToken: string = '';
    private username: string = '';
    private password: string = '';

    private blockfrostProvider: ProviderUtils.BlockfrostProvider | null = null;
    private blockfrostApiKey: string = '';

    constructor(config: ApiConfig) {
        this.config = { timeout: 60000, ...config };
        this.username = config.username || '';
        this.password = config.password || '';
        this.blockfrostApiKey = config.blockfrostApiKey || '';
        this.baseUrl = this.config.url;

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (this.blockfrostApiKey) {
            // check valid api key format
            const prefixes = ['mainnet', 'preview', 'preprod', 'ipfs'];
            const isValid = prefixes.some(prefix => this.blockfrostApiKey.startsWith(prefix));
            if (!isValid) {
                console.warn('⚠️  Warning: The provided Blockfrost API key may be invalid.');
            }
            let network: 'mainnet' | 'preview' | 'preprod' = 'mainnet';
            if (this.blockfrostApiKey.startsWith('preview')) {
                network = 'preview';
            } else if (this.blockfrostApiKey.startsWith('preprod')) {
                network = 'preprod';
            } else {
                throw new Error('Unsupported Blockfrost API key network. Supported: mainnet, preview, preprod');
            }

            this.blockfrostProvider = new ProviderUtils.BlockfrostProvider({
                apiKey: this.blockfrostApiKey,
                network,
            });
        }

        // Add token to requests after login
        this.client.interceptors.request.use(configAxios => {
            if (this.accessToken) {
                configAxios.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return configAxios;
        });
        this.client.interceptors.response.use(res => {
            return res.data;
        });
    }

    async login(): Promise<void> {
        if (!this.username || !this.password) {
            throw new Error('Username and password required for login');
        }

        try {
            const response = await this.client.post<any, AuthResponse>('/hydra-main/login', {
                username: this.username,
                password: this.password,
            });

            if (response.data?.accessToken) {
                this.accessToken = response.data.accessToken;
                console.log('✓ Login successful');
            } else {
                throw new Error('No access token in response');
            }
        } catch (error) {
            throw this.handleError(error, 'Login failed');
        }
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    async getHeads(): Promise<HydraHead[]> {
        try {
            const response = await this.client.get<any>('/hydra-main/active-nodes');
            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch heads');
        }
    }

    async getHeadInfo(headId: string): Promise<HydraHead> {
        try {
            const response = await this.client.get<any>(`/hydra-main/hydra-node/${headId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, `Head '${headId}' not found`);
        }
    }

    async createHead(accountIds: string[]): Promise<HydraHead> {
        try {
            const response = await this.client.post<any>('/hydra-main/create-node', {
                fromAccountId: accountIds[0] || 1,
                description: `Hydra Node`,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Failed to create head');
        }
    }

    async stopHead(headId: string): Promise<void> {
        try {
            await this.client.post(`/hydra-main/hydra-node/${headId}/stop`);
        } catch (error) {
            throw this.handleError(error, `Failed to stop head '${headId}'`);
        }
    }

    async getAccounts(): Promise<WalletAccount[]> {
        try {
            const response = await this.client.get<any>('/hydra-main/list-account');
            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch accounts');
        }
    }

    async addAccount(mnemonic: string): Promise<WalletAccount> {
        try {
            const response = await this.client.post<any>('/hydra-main/create-account', {
                mnemonic,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Failed to add account');
        }
    }

    async getNodes(): Promise<HydraNode[]> {
        try {
            const response = await this.client.get<any>('/hydra-main/hydra-nodes?page=1&limit=50');
            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch nodes');
        }
    }

    async getSystemStatus(): Promise<SystemStatus> {
        try {
            const [nodesRes, activeRes, headsRes] = await Promise.allSettled([
                this.client.get<any>('/hydra-main/hydra-nodes?page=1&limit=1000'),
                this.client.get<any>('/hydra-main/active-nodes'),
                this.client.get<any>('/hydra-main/list-party'),
            ]);

            /**
             * return by pagination:
             * `{
             *  data: HydraNode[],
             *  hasNext: boolean,
             *  page: number,
             * }`
             */
            const nodes: HydraNode[] = nodesRes.status === 'fulfilled' ? nodesRes.value.data.data || [] : [];
            const activeNodes: ActiveNode[] = activeRes.status === 'fulfilled' ? activeRes.value.data || [] : [];
            const activeHeads: HydraHead[] = headsRes.status === 'fulfilled' ? headsRes.value.data || [] : [];

            const runningHeads = activeNodes.reduce((headIds: string[], node: ActiveNode) => {
                if (node.isActive && !headIds.includes(node.hydraNodeId)) {
                    headIds.push(node.hydraNodeId);
                }
                return headIds;
            }, [] as string[]).length;
            const runningNodes = nodes.filter((n: HydraNode) => n.status === 'ACTIVE').length;

            return {
                runningNodes,
                runningHeads,
                totalHeads: activeHeads.length,
                status: nodesRes.status === 'fulfilled' && activeRes.status === 'fulfilled' ? 'healthy' : 'error',
            };
        } catch (error) {
            console.log('>>> / client.ts:202 / error:', error);

            throw this.handleError(error, 'Failed to fetch system status');
        }
    }

    async fetchUtxoByAddress(address: string): Promise<UTxOObject> {
        try {
            if (this.blockfrostProvider) {
                const utxo = await this.blockfrostProvider.fetcher.fetchAddressUTxOs(address);
                return Converter.convertUTxOToUTxOObject(utxo);
            }
            const response = await this.client.get<any>(`/hydra-main/utxo/${address}`, {
                timeout: 120000,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error, `Failed to fetch UTxO for address ${address}`);
        }
    }

    private handleError(error: any, defaultMessage: string): Error {
        // Check for specific error codes first (before axios type check)
        if (error?.code === 'ECONNREFUSED') {
            return new Error(`Cannot connect to ${this.baseUrl}`);
        }
        if (error?.code === 'ENOTFOUND') {
            return new Error(`Host not found: ${this.baseUrl}`);
        }
        if (error?.code === 'ECONNABORTED') {
            return new Error('Operation timed out (60s)');
        }

        // Then check for axios errors
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                return new Error(defaultMessage);
            }
            if (error.response?.status === 400) {
                return new Error(error.response.data?.message || defaultMessage);
            }
            if (error.response?.status === 401) {
                return new Error('Invalid credentials');
            }
            if (error.response?.status === 403) {
                return new Error('Access denied');
            }
        }
        return new Error(defaultMessage);
    }
}
