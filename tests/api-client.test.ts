import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ApiClient, Head, Account, Node, SystemStatus } from '../src/api/client';

// Mock axios module
vi.mock('axios');

describe('ApiClient', () => {
    let client: ApiClient;
    let mockAxiosInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup fresh mock axios instance for each test
        mockAxiosInstance = {
            get: vi.fn(),
            post: vi.fn(),
            interceptors: {
                request: {
                    use: vi.fn().mockReturnValue(undefined),
                },
                response: {
                    use: vi.fn().mockImplementation((handler: any) => handler),
                },
            },
        };

        // Mock axios with proper default export
        const mockAxios = axios as any;
        mockAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
        mockAxios.isAxiosError = vi.fn(err => err?.response !== undefined);

        client = new ApiClient({
            host: 'localhost',
            port: 3013,
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getHeads', () => {
        it('should return list of heads', async () => {
            const mockHeads: Head[] = [
                {
                    id: 'head-1',
                    status: 'running',
                    createdAt: '2025-12-15T10:00:00Z',
                },
            ];

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockHeads });

            const result = await client.getHeads();
            expect(result).toEqual(mockHeads);
        });

        it('should return empty array on error', async () => {
            mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

            try {
                await client.getHeads();
            } catch (error) {
                expect((error as Error).message).toContain('Failed to fetch heads');
            }
        });
    });

    describe('createHead', () => {
        it('should create a new head with accounts', async () => {
            const mockHead: Head = {
                id: 'head-new',
                status: 'running',
                createdAt: '2025-12-15T10:00:00Z',
            };

            mockAxiosInstance.post.mockResolvedValueOnce({ data: mockHead });

            const result = await client.createHead(['account-1', 'account-2']);
            expect(result).toEqual(mockHead);
        });

        it('should throw error on creation failure', async () => {
            const error = new Error('Failed to create');
            (error as any).response = { status: 400 };
            mockAxiosInstance.post.mockRejectedValueOnce(error);

            try {
                await client.createHead(['account-1']);
            } catch (e) {
                expect((e as Error).message).toContain('Failed to create head');
            }
        });
    });

    describe('stopHead', () => {
        it('should stop a head', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

            await expect(client.stopHead('head-1')).resolves.not.toThrow();
        });

        it('should throw error if head not found', async () => {
            const error = new Error('Not found');
            (error as any).response = { status: 404 };
            mockAxiosInstance.post.mockRejectedValueOnce(error);

            try {
                await client.stopHead('invalid-id');
            } catch (e) {
                expect((e as Error).message).toContain('Failed to stop head');
            }
        });
    });

    describe('getHeadInfo', () => {
        it('should return head details', async () => {
            const mockHead: Head = {
                id: 'head-1',
                status: 'running',
                createdAt: '2025-12-15T10:00:00Z',
            };

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockHead });

            const result = await client.getHeadInfo('head-1');
            expect(result).toEqual(mockHead);
        });

        it('should throw error if head not found', async () => {
            const error = new Error('Not found');
            (error as any).response = { status: 404 };
            mockAxiosInstance.get.mockRejectedValueOnce(error);

            try {
                await client.getHeadInfo('invalid-id');
            } catch (e) {
                expect((e as Error).message).toContain('not found');
            }
        });
    });

    describe('getAccounts', () => {
        it('should return list of accounts', async () => {
            const mockAccounts: Account[] = [
                {
                    id: 'acc-1',
                    address: '0x123...',
                    status: 'active',
                    createdAt: '2025-12-15T10:00:00Z',
                },
            ];

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockAccounts });

            const result = await client.getAccounts();
            expect(result).toEqual(mockAccounts);
        });
    });

    describe('addAccount', () => {
        it('should add a new account with valid mnemonic', async () => {
            const mockAccount: Account = {
                id: 'acc-new',
                address: '0x456...',
                status: 'active',
                createdAt: '2025-12-15T10:00:00Z',
            };

            mockAxiosInstance.post.mockResolvedValueOnce({ data: mockAccount });

            const result = await client.addAccount('valid mnemonic phrase');
            expect(result).toEqual(mockAccount);
        });

        it('should throw error on invalid mnemonic', async () => {
            const error = new Error('Invalid mnemonic');
            (error as any).response = { status: 400, data: { message: 'Invalid BIP39 phrase' } };
            mockAxiosInstance.post.mockRejectedValueOnce(error);

            try {
                await client.addAccount('invalid');
            } catch (e) {
                expect((e as Error).message).toContain('Invalid BIP39 phrase');
            }
        });
    });
});
