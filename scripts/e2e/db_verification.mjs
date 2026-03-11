import { execSync } from 'node:child_process';

function esc(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function runTenantScopedRailsQuery(body) {
    const email = process.env.CENIT_E2E_EMAIL || 'support@cenit.io';
    const tenantId = process.env.CENIT_E2E_TENANT_ID || '';
    const ruby = [
        `user_email = '${esc(email)}'`,
        `tenant_id = '${esc(tenantId)}'`,
        "user = User.where(email: user_email).first",
        "user ||= (User.unscoped.where(email: user_email).first rescue nil)",
        "raise(\"user not found for #{user_email}\") unless user",
        "tenant = nil",
        "if !tenant_id.empty?",
        "  tenant = (Account.find_where(id: tenant_id).first rescue nil)",
        "  tenant ||= (Account.unscoped.where(id: tenant_id).first rescue nil)",
        "end",
        "tenant ||= user.account || user.accounts.first || user.member_accounts.first",
        "raise(\"tenant not found for #{user_email}\") unless tenant",
        "tenant.owner_switch do",
        body,
        "end"
    ].join('; ');

    return execSync(
        `docker exec cenit-server-1 bundle exec rails runner "${ruby.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
        { encoding: 'utf8' }
    ).trim();
}

function extractMarker(output, marker) {
    const idx = output.lastIndexOf(marker);
    return idx >= 0 ? output.slice(idx) : '';
}

/**
 * Verifies if a record exists in MongoDB using docker exec.
 * @param {string} recordName The name of the record to search for.
 * @returns {Object} { found: boolean, collection: string | null }
 */
export function verifyRecordDeletion(recordName) {
    console.log(`Verifying deletion of record: ${recordName}`);
    try {
        const result = runTenantScopedRailsQuery(
            `found = nil; ` +
            `data_types = Setup::DataType.all.to_a.select { |dt| dt.respond_to?(:records_model) && dt.records_model }; ` +
            `data_types.each do |dt| ` +
            `  begin; ` +
            `    record = dt.records_model.where(name: '${esc(recordName)}').first; ` +
            `    if record; found = "#{dt.namespace}::#{dt.name}"; break; end; ` +
            `  rescue StandardError; ` +
            `  end; ` +
            `end; ` +
            `print(found ? "FOUND_IN:#{found}" : 'CLEAN')`
        );
        const normalized = result === 'CLEAN' ? result : extractMarker(result, 'FOUND_IN:') || result;

        if (normalized === 'CLEAN') {
            return { found: false, collection: null };
        } else if (normalized.startsWith('FOUND_IN:')) {
            return { found: true, collection: normalized.replace('FOUND_IN:', '') };
        }
    } catch (e) {
        console.error('Error verifying record deletion:', e.message);
        return { found: false, collection: null, error: e.message };
    }
    return { found: false, collection: null };
}

/**
 * Verifies if a Data Type exists and optionally validates its schema.
 * @param {string} namespace 
 * @param {string} name 
 * @returns {Object} { found: boolean, collection: string | null, valid: boolean }
 */
export function verifyDataType(namespace, name) {
    console.log(`Verifying Data Type: ${namespace} | ${name}`);
    try {
        const result = runTenantScopedRailsQuery(
            `dt = Setup::DataType.where(namespace: '${esc(namespace)}', name: '${esc(name)}').first; ` +
            `dt ||= (Setup::DataType.unscoped.where(namespace: '${esc(namespace)}', name: '${esc(name)}').first rescue nil); ` +
            `if dt; ` +
            `  valid = !!(dt.try(:schema).present? || dt.try(:snippet_id).present? || dt.try(:schema_id).present?); ` +
            `  print("FOUND:#{dt.class}|#{valid}|#{dt.id}"); ` +
            `else; ` +
            `  print('NOT_FOUND'); ` +
            `end`
        );
        const normalized = result === 'NOT_FOUND' ? result : extractMarker(result, 'FOUND:') || result;

        if (normalized === 'NOT_FOUND') {
            return { found: false, collection: null, valid: false };
        } else if (normalized.startsWith('FOUND:')) {
            const [_, rest] = normalized.split('FOUND:');
            const [col, validStr, id] = rest.split('|');
            return { found: true, collection: col, valid: validStr === 'true', id };
        }
    } catch (e) {
        console.error('Error verifying Data Type:', e.message);
        return { found: false, collection: null, valid: false, error: e.message };
    }
    return { found: false, collection: null, valid: false };
}
