export const STEP2_SNIPPET_FIELD_SELECTOR_PLAN = Object.freeze([
    { scope: 'panel', type: 'css', value: 'textarea[name="code"], input[name="code"]' },
    { scope: 'panel', type: 'label', value: /^Code$/i },
    { scope: 'panel', type: 'role', value: { role: 'textbox', name: /^Code$/i } },
    { scope: 'page', type: 'css', value: 'textarea[name="code"], input[name="code"]' },
    { scope: 'page', type: 'label', value: /^Code$/i },
    { scope: 'page', type: 'role', value: { role: 'textbox', name: /^Code$/i } }
]);

const DISALLOWED_NAV_KEYWORDS = ['snippets', 'snippet', 'data', 'templates', 'navigation', 'menu', 'sidebar'];

export const selectorPlanHasNavigationTargets = (plan = STEP2_SNIPPET_FIELD_SELECTOR_PLAN) =>
    plan.some((entry) => {
        const serialized = typeof entry?.value === 'string'
            ? entry.value
            : JSON.stringify(entry?.value || {});
        const low = serialized.toLowerCase();
        return DISALLOWED_NAV_KEYWORDS.some((keyword) => low.includes(keyword));
    });
