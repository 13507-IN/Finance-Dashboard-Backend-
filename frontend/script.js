(function () {
  const output = document.getElementById('responseOutput');
  const baseUrlInput = document.getElementById('baseUrl');
  const tokenInput = document.getElementById('jwtToken');

  baseUrlInput.value = localStorage.getItem('apiTesterBaseUrl') || `${window.location.origin}/api`;
  tokenInput.value = localStorage.getItem('apiTesterToken') || '';

  function saveSettings() {
    localStorage.setItem('apiTesterBaseUrl', baseUrlInput.value.trim());
    localStorage.setItem('apiTesterToken', tokenInput.value.trim());
  }

  function clearToken() {
    tokenInput.value = '';
    localStorage.removeItem('apiTesterToken');
  }

  function toIso(value) {
    if (!value) return undefined;
    return new Date(value).toISOString();
  }

  function normalizePath(path) {
    if (!path.startsWith('/')) return `/${path}`;
    return path;
  }

  function printResult(label, payload) {
    const now = new Date().toLocaleTimeString();
    output.textContent = `[${now}] ${label}\n\n${JSON.stringify(payload, null, 2)}`;
  }

  async function request(options) {
    const method = options.method;
    const path = normalizePath(options.path);
    const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, '');

    if (!baseUrl) {
      printResult('Config Error', { message: 'Base API URL is required' });
      return;
    }

    const url = new URL(`${baseUrl}${path}`);

    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (options.useAuth !== false) {
      const token = tokenInput.value.trim();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const init = {
      method,
      headers,
    };

    if (options.body && method !== 'GET' && method !== 'DELETE') {
      init.body = JSON.stringify(options.body);
    }

    try {
      saveSettings();

      const response = await fetch(url.toString(), init);
      const text = await response.text();

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      printResult(`${method} ${path} (${response.status})`, data);
      return data;
    } catch (error) {
      printResult(`${method} ${path} (NETWORK ERROR)`, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  function payloadFromForm(form, fields) {
    const formData = new FormData(form);
    const result = {};

    fields.forEach((field) => {
      const value = formData.get(field.name);
      const cleaned = typeof value === 'string' ? value.trim() : value;

      if (cleaned === '' || cleaned === null) {
        return;
      }

      if (field.type === 'number') {
        result[field.name] = Number(cleaned);
      } else if (field.type === 'boolean') {
        result[field.name] = cleaned === 'true';
      } else if (field.type === 'date') {
        result[field.name] = toIso(cleaned);
      } else {
        result[field.name] = cleaned;
      }
    });

    return result;
  }

  document.getElementById('saveToken').addEventListener('click', () => {
    saveSettings();
    printResult('Info', { message: 'Settings saved' });
  });

  document.getElementById('clearToken').addEventListener('click', () => {
    clearToken();
    printResult('Info', { message: 'Token cleared' });
  });

  document.getElementById('clearOutput').addEventListener('click', () => {
    output.textContent = 'Output cleared.';
  });

  document.getElementById('btnHealth').addEventListener('click', () => {
    request({ method: 'GET', path: '/health', useAuth: false });
  });

  document.getElementById('btnMe').addEventListener('click', () => {
    request({ method: 'GET', path: '/auth/me' });
  });

  document.getElementById('btnDashboard').addEventListener('click', () => {
    request({ method: 'GET', path: '/dashboard' });
  });

  document.getElementById('btnRecords').addEventListener('click', () => {
    request({ method: 'GET', path: '/records' });
  });

  document.getElementById('registerForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = payloadFromForm(form, [
      { name: 'email', type: 'string' },
      { name: 'password', type: 'string' },
      { name: 'role', type: 'string' },
    ]);

    request({ method: 'POST', path: '/auth/register', body, useAuth: false });
  });

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = payloadFromForm(form, [
      { name: 'email', type: 'string' },
      { name: 'password', type: 'string' },
    ]);

    const data = await request({ method: 'POST', path: '/auth/login', body, useAuth: false });
    const token = data && data.data && data.data.token;

    if (token) {
      tokenInput.value = token;
      saveSettings();
      printResult('Login Success', {
        message: 'Token saved from login response',
        token,
      });
    }
  });

  document.getElementById('createRecordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = payloadFromForm(form, [
      { name: 'amount', type: 'number' },
      { name: 'type', type: 'string' },
      { name: 'categoryId', type: 'number' },
      { name: 'date', type: 'date' },
      { name: 'notes', type: 'string' },
      { name: 'userId', type: 'number' },
    ]);

    request({ method: 'POST', path: '/records', body });
  });

  document.getElementById('getCategoriesForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const query = payloadFromForm(form, [{ name: 'type', type: 'string' }]);

    request({ method: 'GET', path: '/categories', query });
  });

  document.getElementById('createCategoryForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = payloadFromForm(form, [
      { name: 'name', type: 'string' },
      { name: 'type', type: 'string' },
    ]);

    request({ method: 'POST', path: '/categories', body });
  });

  document.getElementById('getRecordsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const query = payloadFromForm(form, [
      { name: 'type', type: 'string' },
      { name: 'categoryId', type: 'number' },
      { name: 'search', type: 'string' },
      { name: 'startDate', type: 'date' },
      { name: 'endDate', type: 'date' },
      { name: 'userId', type: 'number' },
      { name: 'sortBy', type: 'string' },
      { name: 'sortOrder', type: 'string' },
      { name: 'page', type: 'number' },
      { name: 'limit', type: 'number' },
    ]);

    request({ method: 'GET', path: '/records', query });
  });

  document.getElementById('updateRecordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get('id') || '').trim();

    if (!id) {
      printResult('Validation Error', { message: 'Record ID is required for update' });
      return;
    }

    const body = payloadFromForm(form, [
      { name: 'amount', type: 'number' },
      { name: 'type', type: 'string' },
      { name: 'categoryId', type: 'number' },
      { name: 'date', type: 'date' },
      { name: 'notes', type: 'string' },
      { name: 'userId', type: 'number' },
    ]);

    request({ method: 'PATCH', path: `/records/${id}`, body });
  });

  document.getElementById('deleteRecordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get('id') || '').trim();

    if (!id) {
      printResult('Validation Error', { message: 'Record ID is required for delete' });
      return;
    }

    request({ method: 'DELETE', path: `/records/${id}` });
  });

  document.getElementById('dashboardForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const query = payloadFromForm(form, [
      { name: 'startDate', type: 'date' },
      { name: 'endDate', type: 'date' },
    ]);

    request({ method: 'GET', path: '/dashboard', query });
  });

  document.getElementById('btnUsers').addEventListener('click', () => {
    request({ method: 'GET', path: '/users' });
  });

  document.getElementById('getUserForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get('id') || '').trim();

    if (!id) {
      printResult('Validation Error', { message: 'User ID is required' });
      return;
    }

    request({ method: 'GET', path: `/users/${id}` });
  });

  document.getElementById('updateUserForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get('id') || '').trim();

    if (!id) {
      printResult('Validation Error', { message: 'User ID is required' });
      return;
    }

    const body = payloadFromForm(form, [
      { name: 'role', type: 'string' },
      { name: 'isActive', type: 'boolean' },
    ]);

    request({ method: 'PATCH', path: `/users/${id}`, body });
  });

  document.getElementById('customForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const method = String(formData.get('method') || 'GET').toUpperCase();
    const path = String(formData.get('path') || '/health').trim();
    const useAuth = Boolean(formData.get('useAuth'));
    const bodyText = String(formData.get('body') || '').trim();

    let body;

    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        printResult('Validation Error', { message: 'Custom body must be valid JSON' });
        return;
      }
    }

    request({ method, path, body, useAuth });
  });
})();
