const env = import.meta.env;

export const msalConfig = {
  auth: {
    clientId: env.VITE_AZURE_CLIENT_ID ?? 'a5b630fa-06a7-49d1-9fcf-be60be7dbd61',
    authority: `https://login.microsoftonline.com/${env.VITE_AZURE_TENANT_ID ?? '02164d4d-30a2-4c6d-a594-b2cccfbd52d9'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  },
  cache: {
    cacheLocation: 'sessionStorage'
  }
};

const ORG_HOST = env.VITE_DATAVERSE_ORG ?? 'org72ddf55d';

export const dataverseScopes = [
  `https://${ORG_HOST}.crm.dynamics.com/user_impersonation`
];

export const ORG = `https://${ORG_HOST}.api.crm.dynamics.com/api/data/v9.2`;
