import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataType } from './DataTypeService';
import { of } from 'rxjs';

// Use vi.mock for modular consistency
vi.mock('./ApiService', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

vi.mock('./AuthorizationService', () => ({
    appRequest: vi.fn(() => of({ data: [] }))
}));

describe('DataType', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { dataTypeCache } = await import('./dataType/cache');
        dataTypeCache.store.dataTypes = {};
        dataTypeCache.store.criteria = {};
        dataTypeCache.store.gets = {};
        dataTypeCache.loaded = false;
        dataTypeCache.loading = null;
    });

    describe('splitName', () => {
        it('returns empty namespace for simple names', () => {
            const [namespace, name] = DataType.splitName('Test');
            expect(namespace).toBe('');
            expect(name).toBe('Test');
        });

        it('splits name with double colons', () => {
            const [namespace, name] = DataType.splitName('Namespace::Test');
            expect(namespace).toBe('Namespace');
            expect(name).toBe('Test');
        });

        it('splits name with nested double colons', () => {
            const [namespace, name] = DataType.splitName('My::Nested::Name');
            expect(namespace).toBe('My::Nested');
            expect(name).toBe('Name');
        });
    });

    describe('find', () => {
        it('calls API and returns a DataType instance on success', async () => {
            const API = (await import('./ApiService')).default;

            (API.get as any).mockImplementation((...args: any[]) => {
                if (args[1] === 'data_type' && typeof args[2] === 'object') {
                    // Search case
                    return of({
                        items: [{ id: '123', name: 'Test', namespace: 'Demo', _type: 'cenit' }]
                    });
                }
                if (args[1] === 'data_type' && args[2] === '123') {
                    // Get by ID case
                    return of({ id: '123', name: 'Test', namespace: 'Demo', _type: 'cenit' });
                }
                return of(null);
            });

            const criteria = { name: 'Test', namespace: 'Demo' };

            const result = await new Promise((resolve) => {
                DataType.find(criteria).subscribe(resolve);
            });

            expect(API.get).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect((result as any).id).toBe('123');
        });
    });
});
