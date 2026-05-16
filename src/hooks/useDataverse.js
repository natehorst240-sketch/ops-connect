import { useMsal } from '@azure/msal-react';
import { dataverseScopes, ORG } from '../auth/config';

export function useDataverse() {
  const { instance, accounts } = useMsal();

  async function getToken() {
    const { accessToken } = await instance.acquireTokenSilent({
      scopes: dataverseScopes,
      account: accounts[0]
    });
    return accessToken;
  }

  async function query(endpoint) {
    const token = await getToken();
    const res = await fetch(`${ORG}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Dataverse query failed: ${res.status} ${endpoint}`);
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Dataverse patch failed: ${res.status} ${table}(${id})`);
  }

  return { query, create, patch };
}
