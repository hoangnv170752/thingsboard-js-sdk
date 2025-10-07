// Main application logic
let client = null;
let currentWebSocket = null;

// DOM elements
const hostDisplay = document.getElementById('hostDisplay');
const connectionStatus = document.getElementById('connectionStatus');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const getDevicesBtn = document.getElementById('getDevicesBtn');
const pageSizeInput = document.getElementById('pageSize');
const pageInput = document.getElementById('page');
const deviceIdInput = document.getElementById('deviceId');
const getDeviceInfoBtn = document.getElementById('getDeviceInfoBtn');
const getKeysBtn = document.getElementById('getKeysBtn');
const getAttributesBtn = document.getElementById('getAttributesBtn');
const getTimeseriesBtn = document.getElementById('getTimeseriesBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const getDashboardsBtn = document.getElementById('getDashboardsBtn');
const dashboardPageSizeInput = document.getElementById('dashboardPageSize');
const dashboardPageInput = document.getElementById('dashboardPage');
const dashboardIdInput = document.getElementById('dashboardId');
const getDashboardInfoBtn = document.getElementById('getDashboardInfoBtn');
const makePublicBtn = document.getElementById('makePublicBtn');
const removePublicBtn = document.getElementById('removePublicBtn');
const getPublicLinkBtn = document.getElementById('getPublicLinkBtn');
const publicDashboardIdInput = document.getElementById('publicDashboardId');
const getPublicDashboardInfoBtn = document.getElementById('getPublicDashboardInfoBtn');
const getUserInfoBtn = document.getElementById('getUserInfoBtn');
const getCustomerUsersBtn = document.getElementById('getCustomerUsersBtn');
const responseOutput = document.getElementById('responseOutput');
const wsOutput = document.getElementById('wsOutput');
const clearBtn = document.getElementById('clearBtn');
const clearWsBtn = document.getElementById('clearWsBtn');
const dashboardModal = document.getElementById('dashboardModal');
const dashboardFrame = document.getElementById('dashboardFrame');
const closeModalBtn = document.querySelector('.close-modal');

// Initialize
function init() {
    // Display the configured host
    if (CONFIG.TB_CLIENT_URL) {
        hostDisplay.textContent = CONFIG.TB_CLIENT_URL;
        
        // Initialize the client with the host
        client = new tbClient({
            host: CONFIG.TB_CLIENT_URL
        });
    } else {
        hostDisplay.textContent = 'Not configured - Please update config.js';
        displayResponse({ error: 'TB_CLIENT_URL not configured in config.js' });
    }
}

// Display response in the output area
function displayResponse(data, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌ ERROR' : '✅ SUCCESS';
    
    // Clear previous content
    responseOutput.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'response-header';
    header.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="${isError ? 'error-badge' : 'success-badge'}">${prefix}</span>`;
    responseOutput.appendChild(header);
    
    // Check if data contains array of devices or other structured data
    if (data.devices && Array.isArray(data.devices)) {
        displayDevicesTable(data.devices);
    } else if (data.dashboards && Array.isArray(data.dashboards)) {
        displayDashboardsTable(data.dashboards);
    } else if (data.users && Array.isArray(data.users)) {
        displayUsersTable(data.users);
    } else if (data.deviceInfo && typeof data.deviceInfo === 'object') {
        displayDeviceInfoTable(data.deviceInfo);
    } else if (data.dashboardInfo && typeof data.dashboardInfo === 'object') {
        displayDashboardInfoTable(data.dashboardInfo);
    } else if (data.userInfo && typeof data.userInfo === 'object') {
        displayUserInfoTable(data.userInfo);
    } else if (data.data && typeof data.data === 'object') {
        displayDataTable(data.data);
    } else if (data.attributes && Array.isArray(data.attributes)) {
        displayAttributesTable(data.attributes);
    } else if (data.attributes && typeof data.attributes === 'object') {
        displayKeyValueTable(data.attributes, 'Attributes');
    } else if (data.keys && Array.isArray(data.keys)) {
        displayKeysTable(data.keys);
    } else {
        // Fallback to JSON display
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(data, null, 2);
        responseOutput.appendChild(pre);
    }

    // Add "View Dashboard" button if publicLink is present
    if (data.publicLink) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '15px';
        buttonContainer.style.textAlign = 'center';
        
        const viewButton = createViewDashboardButton(data.publicLink, '🔗 Open Dashboard in Modal');
        buttonContainer.appendChild(viewButton);
        
        responseOutput.appendChild(buttonContainer);
    }
}

// Display devices in table format
function displayDevicesTable(devices) {
    if (!devices || devices.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No devices found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Label</th>
            <th>Device ID</th>
            <th>Created Time</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    devices.forEach(device => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${device.name || 'N/A'}</strong></td>
            <td>${device.type || 'N/A'}</td>
            <td>${device.label || '-'}</td>
            <td><code class="device-id">${device.id?.id || 'N/A'}</code></td>
            <td>${device.createdTime ? new Date(device.createdTime).toLocaleString() : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display keys in table format
function displayKeysTable(keys) {
    if (!keys || keys.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No keys found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Key Name</th></tr>';
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    keys.forEach((key, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><code>${key}</code></td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display key-value data in table format
function displayKeyValueTable(data, title = 'Data') {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Key</th><th>Value</th></tr>`;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    Object.entries(data).forEach(([key, value]) => {
        const row = document.createElement('tr');
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
        row.innerHTML = `
            <td><strong>${key}</strong></td>
            <td>${displayValue}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display timeseries data in table format
function displayDataTable(data) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No data found</p>';
        return;
    }
    
    keys.forEach(key => {
        const section = document.createElement('div');
        section.className = 'data-section';
        
        const title = document.createElement('h3');
        title.textContent = key;
        section.appendChild(title);
        
        const values = data[key];
        if (Array.isArray(values) && values.length > 0) {
            const table = document.createElement('table');
            table.className = 'data-table';
            
            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Timestamp</th><th>Value</th></tr>';
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            values.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(item.ts).toLocaleString()}</td>
                    <td><strong>${item.value}</strong></td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            
            section.appendChild(table);
        } else {
            section.innerHTML += '<p class="no-data">No values</p>';
        }
        
        responseOutput.appendChild(section);
    });
}

// Display attributes in table format
function displayAttributesTable(attributes) {
    if (!attributes || attributes.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No attributes found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Key</th><th>Value</th><th>Last Update</th></tr>';
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    attributes.forEach(attr => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${attr.key}</strong></td>
            <td>${attr.value}</td>
            <td>${attr.lastUpdateTs ? new Date(attr.lastUpdateTs).toLocaleString() : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display dashboards in table format
function displayDashboardsTable(dashboards) {
    if (!dashboards || dashboards.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No dashboards found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Title</th>
            <th>Dashboard ID</th>
            <th>Created Time</th>
            <th>Action</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    dashboards.forEach(dashboard => {
        const row = document.createElement('tr');
        
        const titleCell = document.createElement('td');
        titleCell.innerHTML = `<strong>${dashboard.title || 'N/A'}</strong>`;
        
        const idCell = document.createElement('td');
        idCell.innerHTML = `<code class="device-id">${dashboard.id?.id || 'N/A'}</code>`;
        
        const timeCell = document.createElement('td');
        timeCell.textContent = dashboard.createdTime ? new Date(dashboard.createdTime).toLocaleString() : 'N/A';
        
        const actionCell = document.createElement('td');
        if (dashboard.id?.id && CONFIG.TB_CLIENT_URL) {
            const dashboardUrl = `https://${CONFIG.TB_CLIENT_URL}/dashboards/${dashboard.id.id}`;
            const viewBtn = createViewDashboardButton(dashboardUrl, '👁️ View', true);
            viewBtn.style.margin = '0';
            viewBtn.style.padding = '6px 12px';
            viewBtn.style.fontSize = '12px';
            actionCell.appendChild(viewBtn);
        }
        
        row.appendChild(titleCell);
        row.appendChild(idCell);
        row.appendChild(timeCell);
        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display users in table format
function displayUsersTable(users) {
    if (!users || users.length === 0) {
        responseOutput.innerHTML += '<p class="no-data">No users found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Authority</th>
            <th>Created Time</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user.email || 'N/A'}</strong></td>
            <td>${user.firstName || '-'}</td>
            <td>${user.lastName || '-'}</td>
            <td><span class="badge">${user.authority || 'N/A'}</span></td>
            <td>${user.createdTime ? new Date(user.createdTime).toLocaleString() : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display device info in table format
function displayDeviceInfoTable(deviceInfo) {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Property</th><th>Value</th></tr>';
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    const fields = [
        { key: 'Name', value: deviceInfo.name },
        { key: 'Type', value: deviceInfo.type },
        { key: 'Label', value: deviceInfo.label },
        { key: 'Device ID', value: deviceInfo.id?.id },
        { key: 'Created Time', value: deviceInfo.createdTime ? new Date(deviceInfo.createdTime).toLocaleString() : 'N/A' },
        { key: 'Customer ID', value: deviceInfo.customerId?.id || 'N/A' },
        { key: 'Tenant ID', value: deviceInfo.tenantId?.id || 'N/A' }
    ];
    
    fields.forEach(field => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${field.key}</strong></td>
            <td>${field.value || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display dashboard info in table format
function displayDashboardInfoTable(dashboardInfo) {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Property</th><th>Value</th></tr>';
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    const fields = [
        { key: 'Title', value: dashboardInfo.title },
        { key: 'Dashboard ID', value: dashboardInfo.id?.id },
        { key: 'Created Time', value: dashboardInfo.createdTime ? new Date(dashboardInfo.createdTime).toLocaleString() : 'N/A' },
        { key: 'Tenant ID', value: dashboardInfo.tenantId?.id || 'N/A' },
        { key: 'Assigned Customers', value: dashboardInfo.assignedCustomers?.length || 0 }
    ];
    
    fields.forEach(field => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${field.key}</strong></td>
            <td>${field.value || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
    
    // Add "View Dashboard" button for non-public dashboard
    if (dashboardInfo.id?.id && client && CONFIG.TB_CLIENT_URL) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '15px';
        buttonContainer.style.textAlign = 'center';
        
        const dashboardUrl = `https://${CONFIG.TB_CLIENT_URL}/dashboards/${dashboardInfo.id.id}`;
        const viewButton = createViewDashboardButton(dashboardUrl, '📊 Open Dashboard (with Auth)', true);
        buttonContainer.appendChild(viewButton);
        
        responseOutput.appendChild(buttonContainer);
    }
}

// Display user info in table format
function displayUserInfoTable(userInfo) {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Property</th><th>Value</th></tr>';
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    const fields = [
        { key: 'Email', value: userInfo.email },
        { key: 'First Name', value: userInfo.firstName },
        { key: 'Last Name', value: userInfo.lastName },
        { key: 'Authority', value: userInfo.authority },
        { key: 'User ID', value: userInfo.id?.id },
        { key: 'Tenant ID', value: userInfo.tenantId?.id || 'N/A' },
        { key: 'Customer ID', value: userInfo.customerId?.id || 'N/A' },
        { key: 'Created Time', value: userInfo.createdTime ? new Date(userInfo.createdTime).toLocaleString() : 'N/A' }
    ];
    
    fields.forEach(field => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${field.key}</strong></td>
            <td>${field.value || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    responseOutput.appendChild(table);
}

// Display WebSocket message
function displayWsMessage(data) {
    const timestamp = new Date().toLocaleTimeString();
    const currentContent = wsOutput.textContent;
    
    if (currentContent === 'No WebSocket messages yet...') {
        wsOutput.textContent = '';
    }
    
    wsOutput.textContent = `[${timestamp}]\n${JSON.stringify(data, null, 2)}\n\n${wsOutput.textContent}`;
}

// Update UI state
function updateUIState(connected) {
    connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
    connectionStatus.className = connected ? 'value status-connected' : 'value status-disconnected';
    
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    getDevicesBtn.disabled = !connected;
    getDeviceInfoBtn.disabled = !connected;
    getKeysBtn.disabled = !connected;
    getAttributesBtn.disabled = !connected;
    getTimeseriesBtn.disabled = !connected;
    subscribeBtn.disabled = !connected;
    getDashboardsBtn.disabled = !connected;
    getDashboardInfoBtn.disabled = !connected;
    makePublicBtn.disabled = !connected;
    removePublicBtn.disabled = !connected;
    getPublicLinkBtn.disabled = !connected;
    getUserInfoBtn.disabled = !connected;
    getCustomerUsersBtn.disabled = !connected;
}

// Connect to ThingsBoard
connectBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        displayResponse({ error: 'Please enter username and password' }, true);
        return;
    }

    if (!client) {
        displayResponse({ error: 'Client not initialized. Check config.js' }, true);
        return;
    }

    // Update client config
    client.config.username = username;
    client.config.password = password;

    displayResponse({ status: 'Connecting...' });

    try {
        const result = await client.connect();
        
        if (result) {
            displayResponse({
                message: 'Successfully connected to ThingsBoard',
                token: result.token.substring(0, 20) + '...',
                user: result.user ? JSON.parse(result.user) : null
            });
            updateUIState(true);
        } else {
            displayResponse({ error: 'Failed to connect. Check credentials and host.' }, true);
            updateUIState(false);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
        updateUIState(false);
    }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
    if (client) {
        client.disconnect();
        displayResponse({ message: 'Disconnected from ThingsBoard' });
        updateUIState(false);
        
        // Close WebSocket if open
        if (currentWebSocket) {
            currentWebSocket.close();
            currentWebSocket = null;
        }
    }
});

// Get Tenant Devices
getDevicesBtn.addEventListener('click', async () => {
    const pageSize = parseInt(pageSizeInput.value) || 10;
    const page = parseInt(pageInput.value) || 0;

    displayResponse({ status: 'Fetching devices...' });

    try {
        const devices = await client.getTenantDevices({
            pageSize: pageSize,
            page: page
        });

        if (devices) {
            displayResponse({
                message: `Found ${devices.length} device(s)`,
                devices: devices
            });
        } else {
            displayResponse({ error: 'Failed to fetch devices' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Timeseries Keys
getKeysBtn.addEventListener('click', async () => {
    const deviceId = deviceIdInput.value.trim();

    if (!deviceId) {
        displayResponse({ error: 'Please enter a device ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching timeseries keys...' });

    try {
        const keys = await client.getKeys({
            entityId: deviceId,
            scope: 'timeseries'
        });

        if (keys) {
            displayResponse({
                message: 'Timeseries keys retrieved',
                deviceId: deviceId,
                keys: keys
            });
        } else {
            displayResponse({ error: 'Failed to fetch keys' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Attributes
getAttributesBtn.addEventListener('click', async () => {
    const deviceId = deviceIdInput.value.trim();

    if (!deviceId) {
        displayResponse({ error: 'Please enter a device ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching attributes...' });

    try {
        // First get the keys
        const keys = await client.getKeys({
            entityId: deviceId,
            scope: 'client'
        });

        if (keys && keys.length > 0) {
            // Then get the attributes
            const attributes = await client.getAttributesByScope({
                entityId: deviceId,
                scope: 'CLIENT_SCOPE',
                keys: keys
            });

            displayResponse({
                message: 'Attributes retrieved',
                deviceId: deviceId,
                attributes: attributes
            });
        } else {
            displayResponse({ 
                message: 'No client attributes found for this device',
                deviceId: deviceId 
            });
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Timeseries Data
getTimeseriesBtn.addEventListener('click', async () => {
    const deviceId = deviceIdInput.value.trim();

    if (!deviceId) {
        displayResponse({ error: 'Please enter a device ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching timeseries data...' });

    try {
        // First get the keys
        const keys = await client.getKeys({
            entityId: deviceId,
            scope: 'timeseries'
        });

        if (keys && keys.length > 0) {
            // Get timeseries data for the first 5 keys
            const keysToFetch = keys.slice(0, 5);
            
            const timeseries = await client.getTimeseries({
                entityId: deviceId,
                keys: keysToFetch,
                limit: 10
            });

            displayResponse({
                message: 'Timeseries data retrieved',
                deviceId: deviceId,
                keys: keysToFetch,
                data: timeseries
            });
        } else {
            displayResponse({ 
                message: 'No timeseries keys found for this device',
                deviceId: deviceId 
            });
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Subscribe to WebSocket
subscribeBtn.addEventListener('click', () => {
    const deviceId = deviceIdInput.value.trim();

    if (!deviceId) {
        displayResponse({ error: 'Please enter a device ID' }, true);
        return;
    }

    if (currentWebSocket) {
        currentWebSocket.close();
        currentWebSocket = null;
        subscribeBtn.textContent = 'Subscribe (WebSocket)';
        displayResponse({ message: 'WebSocket connection closed' });
        return;
    }

    displayResponse({ status: 'Subscribing to device telemetry via WebSocket...' });

    try {
        currentWebSocket = client.subscribe({
            entityId: deviceId,
            cmdId: 10
        }, (data) => {
            if (data) {
                displayWsMessage(data);
            } else {
                displayResponse({ message: 'WebSocket connection closed' });
                currentWebSocket = null;
                subscribeBtn.textContent = 'Subscribe (WebSocket)';
            }
        });

        subscribeBtn.textContent = 'Unsubscribe (WebSocket)';
        displayResponse({ 
            message: 'WebSocket subscription active',
            deviceId: deviceId,
            note: 'Messages will appear in the WebSocket Messages section below'
        });
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Device Info
getDeviceInfoBtn.addEventListener('click', async () => {
    const deviceId = deviceIdInput.value.trim();

    if (!deviceId) {
        displayResponse({ error: 'Please enter a device ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching device info...' });

    try {
        const deviceInfo = await client.getDeviceInfo(deviceId);

        if (deviceInfo) {
            displayResponse({
                message: 'Device information retrieved',
                deviceInfo: deviceInfo
            });
        } else {
            displayResponse({ error: 'Failed to fetch device info' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Dashboards
getDashboardsBtn.addEventListener('click', async () => {
    const pageSize = parseInt(dashboardPageSizeInput.value) || 10;
    const page = parseInt(dashboardPageInput.value) || 0;

    displayResponse({ status: 'Fetching dashboards...' });

    try {
        const dashboards = await client.getDashboards({
            pageSize: pageSize,
            page: page
        });

        if (dashboards) {
            displayResponse({
                message: `Found ${dashboards.length} dashboard(s)`,
                dashboards: dashboards
            });
        } else {
            displayResponse({ error: 'Failed to fetch dashboards' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Dashboard Info
getDashboardInfoBtn.addEventListener('click', async () => {
    const dashboardId = dashboardIdInput.value.trim();

    if (!dashboardId) {
        displayResponse({ error: 'Please enter a dashboard ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching dashboard info...' });

    try {
        const dashboardInfo = await client.getDashboardInfo(dashboardId);

        if (dashboardInfo) {
            displayResponse({
                message: 'Dashboard information retrieved',
                dashboardInfo: dashboardInfo
            });
        } else {
            displayResponse({ error: 'Failed to fetch dashboard info' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Current User Info
getUserInfoBtn.addEventListener('click', async () => {
    displayResponse({ status: 'Fetching user info...' });

    try {
        const userInfo = await client.getUserInfo();

        if (userInfo) {
            displayResponse({
                message: 'User information retrieved',
                userInfo: userInfo
            });
        } else {
            displayResponse({ error: 'Failed to fetch user info' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Customer Users
getCustomerUsersBtn.addEventListener('click', async () => {
    displayResponse({ status: 'Fetching customer users...' });

    try {
        const users = await client.getCustomerUsers({
            pageSize: 100,
            page: 0
        });

        if (users) {
            displayResponse({
                message: `Found ${users.length} customer user(s)`,
                users: users
            });
        } else {
            displayResponse({ error: 'Failed to fetch customer users' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Make Dashboard Public
makePublicBtn.addEventListener('click', async () => {
    const dashboardId = dashboardIdInput.value.trim();

    if (!dashboardId) {
        displayResponse({ error: 'Please enter a dashboard ID' }, true);
        return;
    }

    displayResponse({ status: 'Making dashboard public...' });

    try {
        const result = await client.makeDashboardPublic(dashboardId);

        if (result) {
            displayResponse({
                message: 'Dashboard is now public',
                publicInfo: result,
                note: 'Use the publicId to access this dashboard without authentication'
            });
        } else {
            displayResponse({ error: 'Failed to make dashboard public' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Remove Dashboard Public Access
removePublicBtn.addEventListener('click', async () => {
    const dashboardId = dashboardIdInput.value.trim();

    if (!dashboardId) {
        displayResponse({ error: 'Please enter a dashboard ID' }, true);
        return;
    }

    displayResponse({ status: 'Removing public access...' });

    try {
        const result = await client.removeDashboardPublic(dashboardId);

        displayResponse({
            message: 'Public access removed from dashboard',
            result: result || 'Success'
        });
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Public Dashboard Link
getPublicLinkBtn.addEventListener('click', async () => {
    const dashboardId = dashboardIdInput.value.trim();

    if (!dashboardId) {
        displayResponse({ error: 'Please enter a dashboard ID' }, true);
        return;
    }

    displayResponse({ status: 'Getting public dashboard link...' });

    try {
        const result = await client.getPublicDashboardLink(dashboardId);

        if (result) {
            displayResponse({
                message: 'Public dashboard link generated',
                publicId: result.publicId,
                publicLink: result.publicLink,
                note: 'Anyone with this link can view the dashboard without logging in'
            });
        } else {
            displayResponse({ error: 'Failed to get public dashboard link' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Get Public Dashboard Info (No Authentication)
getPublicDashboardInfoBtn.addEventListener('click', async () => {
    const publicId = publicDashboardIdInput.value.trim();

    if (!publicId) {
        displayResponse({ error: 'Please enter a public dashboard ID' }, true);
        return;
    }

    displayResponse({ status: 'Fetching public dashboard info (no auth)...' });

    try {
        const dashboardInfo = await client.getPublicDashboardInfo(publicId);

        if (dashboardInfo) {
            displayResponse({
                message: 'Public dashboard information retrieved (without authentication)',
                dashboardInfo: dashboardInfo
            });
        } else {
            displayResponse({ error: 'Failed to fetch public dashboard info' }, true);
        }
    } catch (error) {
        displayResponse({ error: error.message }, true);
    }
});

// Clear response
clearBtn.addEventListener('click', () => {
    responseOutput.innerHTML = '<p class="no-data">No response yet...</p>';
});

// Clear WebSocket output
clearWsBtn.addEventListener('click', () => {
    wsOutput.textContent = 'No WebSocket messages yet...';
});

// Modal functions
async function openDashboardModal(url, useToken = true) {
    // Extract dashboard ID from URL
    const dashboardIdMatch = url.match(/dashboards?\/([a-f0-9-]+)/i);
    
    if (dashboardIdMatch && client && client.token) {
        const dashboardId = dashboardIdMatch[1];
        
        // Show loading
        dashboardFrame.srcdoc = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial; color: #667eea;"><h2>Loading dashboard...</h2></div>';
        dashboardModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        try {
            // Call API to get dashboard configuration
            const dashboardData = await client.getDashboardInfo(dashboardId);
            
            if (dashboardData) {
                // Render dashboard with custom viewer
                renderDashboard(dashboardData);
            } else {
                dashboardFrame.srcdoc = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial; color: #f44336;"><h2>Failed to load dashboard</h2></div>';
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            dashboardFrame.srcdoc = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial; color: #f44336;"><h2>Error: ${error.message}</h2></div>`;
        }
    } else {
        // Fallback to iframe with token in URL
        let finalUrl = url;
        if (useToken && client && client.token) {
            const separator = url.includes('?') ? '&' : '?';
            finalUrl = `${url}${separator}token=${client.token}`;
        }
        dashboardFrame.src = finalUrl;
        dashboardModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Render dashboard from API data
function renderDashboard(dashboardData) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboardData.title || 'Dashboard'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .dashboard-header h1 {
            font-size: 24px;
            margin-bottom: 8px;
        }
        .dashboard-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .info-item {
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
            word-break: break-all;
        }
        .widgets-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .widgets-section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .widget-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border: 1px solid #e0e0e0;
        }
        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .widget-title {
            font-weight: 600;
            color: #667eea;
        }
        .widget-type {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        .widget-info {
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        .badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 8px;
        }
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1>${dashboardData.title || 'Untitled Dashboard'}</h1>
        <div style="font-size: 14px; opacity: 0.9;">
            ${dashboardData.configuration?.description || 'No description'}
        </div>
    </div>

    <div class="dashboard-info">
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Dashboard ID</div>
                <div class="info-value">${dashboardData.id?.id || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Created Time</div>
                <div class="info-value">${dashboardData.createdTime ? new Date(dashboardData.createdTime).toLocaleString() : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Version</div>
                <div class="info-value">${dashboardData.version || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Public</div>
                <div class="info-value">
                    ${dashboardData.assignedCustomers?.some(c => c.public) ? '<span class="badge">✓ Public</span>' : 'Private'}
                </div>
            </div>
        </div>
    </div>

    <div class="widgets-section">
        <h2>Widgets (${Object.keys(dashboardData.configuration?.widgets || {}).length})</h2>
        ${renderWidgets(dashboardData.configuration?.widgets || {})}
    </div>

    <div class="widgets-section" style="margin-top: 20px;">
        <h2>Full Configuration</h2>
        <pre>${JSON.stringify(dashboardData, null, 2)}</pre>
    </div>
</body>
</html>
    `;
    
    dashboardFrame.srcdoc = html;
}

function renderWidgets(widgets) {
    if (!widgets || Object.keys(widgets).length === 0) {
        return '<p style="color: #999; text-align: center; padding: 20px;">No widgets configured</p>';
    }
    
    return Object.entries(widgets).map(([id, widget]) => `
        <div class="widget-card">
            <div class="widget-header">
                <div class="widget-title">${widget.config?.title || 'Untitled Widget'}</div>
                <div class="widget-type">${widget.typeFullFqn || widget.type || 'Unknown'}</div>
            </div>
            <div class="widget-info">
                <strong>Type:</strong> ${widget.type || 'N/A'}<br>
                <strong>Size:</strong> ${widget.sizeX || 0} x ${widget.sizeY || 0}<br>
                <strong>Position:</strong> Row ${widget.row || 0}, Col ${widget.col || 0}<br>
                ${widget.config?.datasources ? `<strong>Datasources:</strong> ${widget.config.datasources.length}` : ''}
            </div>
        </div>
    `).join('');
}

function closeDashboardModal() {
    dashboardModal.style.display = 'none';
    dashboardFrame.src = '';
    dashboardFrame.srcdoc = '';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking X
closeModalBtn.addEventListener('click', closeDashboardModal);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === dashboardModal) {
        closeDashboardModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dashboardModal.style.display === 'block') {
        closeDashboardModal();
    }
});

// Helper function to create view dashboard button
function createViewDashboardButton(url, label = 'View Dashboard', useToken = true) {
    const button = document.createElement('button');
    button.className = 'btn btn-view-dashboard';
    button.textContent = label;
    button.onclick = () => openDashboardModal(url, useToken);
    return button;
}

// Initialize on page load
init();
