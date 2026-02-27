import { describe, expect, it } from 'vitest';
import {
    STEP2_SNIPPET_FIELD_SELECTOR_PLAN,
    selectorPlanHasNavigationTargets
} from './step2_snippet_field_selectors.mjs';

describe('step2 snippet selector plan', () => {
    it('targets only code editors in panel/page scopes', () => {
        const scopes = STEP2_SNIPPET_FIELD_SELECTOR_PLAN.map((entry) => entry.scope);
        expect(scopes).toEqual(['panel', 'panel', 'panel', 'page', 'page', 'page']);
        expect(selectorPlanHasNavigationTargets()).toBe(false);
    });

    it('does not contain label selectors for navigation entries', () => {
        const labels = STEP2_SNIPPET_FIELD_SELECTOR_PLAN
            .filter((entry) => entry.type === 'label')
            .map((entry) => String(entry.value));
        expect(labels.every((label) => /code/i.test(label))).toBe(true);
    });
});
