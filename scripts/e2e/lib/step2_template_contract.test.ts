import { describe, expect, it } from 'vitest';
import { buildDataTypeDigestPath, matchesDataTypeDigestPost } from './step2_template_contract.mjs';

describe('step2 template save contract', () => {
    it('builds the digest path for the expected type id', () => {
        expect(buildDataTypeDigestPath('abc123')).toBe('/api/v3/setup/data_type/abc123/digest');
    });

    it('matches only POST responses for the expected type id digest endpoint', () => {
        expect(matchesDataTypeDigestPost({
            method: 'POST',
            url: 'http://localhost:3000/api/v3/setup/data_type/abc123/digest'
        }, 'abc123')).toBe(true);

        expect(matchesDataTypeDigestPost({
            method: 'GET',
            url: 'http://localhost:3000/api/v3/setup/data_type/abc123/digest'
        }, 'abc123')).toBe(false);

        expect(matchesDataTypeDigestPost({
            method: 'POST',
            url: 'http://localhost:3000/api/v3/setup/data_type/wrong/digest'
        }, 'abc123')).toBe(false);
    });
});
