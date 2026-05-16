export const msalConfig = {
  auth: {
    clientId: 'a5b630fa-06a7-49d1-9fcf-be60be7dbd61',
    authority: 'https://login.microsoftonline.com/02164d4d-30a2-4c6d-a594-b2cccfbd52d9',
    redirectUri: 'http://localhost:5173'
  },
  cache: {
    cacheLocation: 'sessionStorage'
  }
};

export const dataverseScopes = [
  'https://org72ddf55d.crm.dynamics.com/user_impersonation'
];

export const ORG = 'https://org72ddf55d.api.crm.dynamics.com/api/data/v9.2';
