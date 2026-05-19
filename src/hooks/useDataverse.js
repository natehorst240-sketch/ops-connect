import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { dataverseScopes, ORG } from '../auth/config';

export function useDataverse() {
  const { instance, accounts } = useMsal();

  async function getToken() {
    if (!accounts[0]) throw new Error('Not signed in');
    try {
      const { accessToken } = await instance.acquireTokenSilent({
        scopes: dataverseScopes,
        account: accounts[0]
      });
      return accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        const { accessToken } = await instance.acquireTokenPopup({ scopes: dataverseScopes });
        return accessToken;
      }
      throw e;
    }
  }

  // Retries on 429 / 503 / 5xx with exponential backoff + jitter.
  // Only for idempotent read operations — writes use single-attempt fetch.
  async function fetchWithRetry(url, options) {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const res = await fetch(url, options);
      if (res.ok) return res;
      const retryable = res.status === 429 || res.status === 503 || res.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        throw new Error(`Dataverse ${res.status}: ${url}`);
      }
      const delay = (2 ** attempt) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Accepts OData query options to avoid full-table scans.
  async function query(endpoint, { filter, select, top, orderby } = {}) {
    const token = await getToken();
    const params = new URLSearchParams();
    if (filter)       params.set('$filter',  filter);
    if (select)       params.set('$select',  select);
    if (top != null)  params.set('$top',     String(top));
    if (orderby)      params.set('$orderby', orderby);
    const qs = params.toString();
    const url = `${ORG}/${endpoint}${qs ? `?${qs}` : ''}`;
    const res = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'
      }
    });
    const data = await res.json();
    return data.value ?? data;
  }

  async function create(table, body) {
    const token = await getToken();
    const res = await fetch(`${ORG}/${table}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Dataverse create failed: ${res.status} ${table}`);
    return res.json();
  }

  async function patch(table, id, body) {
    const token = await getToken();
    const res = await fetch(`${ORG}/${table}(${id})`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        'If-Match': '*'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Dataverse patch failed: ${res.status} ${table}(${id})`);
  }

  return { query, create, patch };
}
