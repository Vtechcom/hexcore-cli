import axios, { AxiosInstance } from 'axios';

export interface ApiConfig {
    host?: string;
    port?: number;
    url?: string;
    timeout?: number;
    username?: string;
    password?: string;
}

export interface AuthResponse {
    data: {
        accessToken: string;
    };
    statusCode: number;
    message: string;
    status: string;
}

export interface Head {
    id: number;
    description: string | null;
    nodes: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    hydraNodes: Array<Node>;
}

export interface Account {
    id: string;
    address: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export interface Node {
    id: number;
    description: string;
    port: number;
    vkey: string;
    createdAt: string;
    cardanoAccount: {
        id: number;
        baseAddress: string;
        pointerAddress: string;
        createdAt: string;
    };
    status: 'ACTIVE' | 'INACTIVE';
}

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

    constructor(config: ApiConfig) {
        this.config = { timeout: 60000, ...config };
        this.username = config.username || '';
        this.password = config.password || '';

        // Support both URL format and host:port format
        if (config.url) {
            this.baseUrl = config.url;
        } else {
            const host = config.host || 'localhost';
            const port = config.port || 3013;
            this.baseUrl = `http://${host}:${port}`;
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

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

    async getHeads(): Promise<Head[]> {
        try {
            const response = await this.client.get('/hydra-main/active-nodes');
            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch heads');
        }
    }

    async getHeadInfo(headId: string): Promise<Head> {
        try {
            const response = await this.client.get(`/hydra-main/hydra-node/${headId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, `Head '${headId}' not found`);
        }
    }

    async createHead(accountIds: string[]): Promise<Head> {
        try {
            const response = await this.client.post('/hydra-main/create-node', {
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

    async getAccounts(): Promise<Account[]> {
        try {
            const response = await this.client.get('/hydra-main/list-account');
            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch accounts');
        }
    }

    async addAccount(mnemonic: string): Promise<Account> {
        try {
            const response = await this.client.post('/hydra-main/create-account', {
                mnemonic,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Failed to add account');
        }
    }

    async getNodes(): Promise<Node[]> {
        try {
            const response = await this.client.get('/hydra-main/hydra-nodes?page=1&limit=50');
            return response.data?.data || response.data || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to fetch nodes');
        }
    }

    async getSystemStatus(): Promise<SystemStatus> {
        try {
            const [nodesRes, activeRes, headsRes] = await Promise.allSettled([
                this.client.get<{ data: Node[] }>('/hydra-main/hydra-nodes?page=1&limit=1000'),
                this.client.get<ActiveNode[]>('/hydra-main/active-nodes'),
                this.client.get<Head[]>('/hydra-main/list-party'),
            ]);

            const nodes = nodesRes.status === 'fulfilled' ? nodesRes.value.data?.data || nodesRes.value.data || [] : [];
            const activeNodes = activeRes.status === 'fulfilled' ? activeRes.value.data || [] : [];
            const activeHeads = headsRes.status === 'fulfilled' ? headsRes.value.data || [] : [];

            const runningHeads = activeNodes.reduce((headIds, node) => {
                if (node.isActive && !headIds.includes(node.hydraNodeId)) {
                    headIds.push(node.hydraNodeId);
                }
                return headIds;
            }, [] as string[]).length;
            const runningNodes = nodes.filter((n: Node) => n.status === 'ACTIVE').length;

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
