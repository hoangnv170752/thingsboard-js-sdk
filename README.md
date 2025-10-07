# ThingsBoard JavaScript SDK

Enhanced JavaScript SDK for ThingsBoard IoT Platform with extended features.

**Forked from:** [acte-technology/thingsboard-js-sdk](https://github.com/acte-technology/thingsboard-js-sdk)  
**Repository:** [hoangnv170752/thingsboard-js-sdk](https://github.com/hoangnv170752/thingsboard-js-sdk)

## ✨ Features

- 🔐 Multiple authentication methods (username/password, SSO token, public)
- 📱 Device management and telemetry
- 📊 Dashboard operations (list, info, public links)
- 👥 User and customer management
- 🔌 WebSocket subscriptions for real-time data
- 🌐 Browser and Node.js compatible
- 🧪 Built-in test interface

## 📦 Installation

```bash
npm install https://github.com/hoangnv170752/thingsboard-js-sdk.git
```

## 🚀 Quick Start

### Import

```javascript
// Node.js
const tbClient = require('thingsboard-js-sdk');

// ES6 / Browser
import tbClient from 'thingsboard-js-sdk';
```

## 🔐 Authentication Methods

### 1. Username/Password Authentication

```javascript
const client = new tbClient({
  host: 'iot.facenet.vn',
  username: 'user@example.com',
  password: 'password'
});

const result = await client.connect();
console.log(result.token); // JWT token
console.log(result.user);  // User info
```

### 2. SSO Token Authentication (Mobile Apps)

```javascript
// Option 1: Pass token in constructor
const client = new tbClient({
  host: 'iot.facenet.vn',
  token: 'eyJhbGciOiJIUzUxMiJ9...' // Token from SSO
});

await client.connect(); // Auto-verify token

// Option 2: Use dedicated method
const client = new tbClient({ host: 'iot.facenet.vn' });
await client.connectWithToken('eyJhbGciOiJIUzUxMiJ9...');
```

### 3. Public Dashboard Access

```javascript
const client = new tbClient({
  host: 'iot.facenet.vn',
  publicId: 'xxx-xxx-xxx-xxx' // Public dashboard ID
});

await client.connect(true); // true for public login
```

## 📋 API Methods

### Device Operations

#### Get Tenant Devices
```javascript
const devices = await client.getTenantDevices({
  pageSize: 100,
  page: 0,
  sortProperty: 'name',
  sortOrder: 'ASC'
});
```

#### Get Device Info
```javascript
const deviceInfo = await client.getDeviceInfo('device-id-xxx');
```

#### Get Telemetry Keys
```javascript
const keys = await client.getKeys({
  entityId: 'device-id-xxx',
  scope: 'timeseries' // timeseries | client | shared | server
});
```

#### Get Attributes
```javascript
const attributes = await client.getAttributesByScope({
  entityId: 'device-id-xxx',
  scope: 'CLIENT_SCOPE', // CLIENT_SCOPE | SHARED_SCOPE | SERVER_SCOPE
  keys: ['temperature', 'humidity']
});
```

#### Get Timeseries Data
```javascript
const timeseries = await client.getTimeseries({
  entityId: 'device-id-xxx',
  keys: ['temperature', 'humidity'],
  limit: 500,
  agg: 'AVG',
  interval: 60000,
  startTs: Date.now() - 3600000,
  endTs: Date.now(),
  useStrictDataTypes: true
});
```

#### Delete Keys
```javascript
await client.deleteEntityKeys({
  entityId: 'device-id-xxx',
  keys: ['temperature', 'humidity'],
  olderThan: Date.now() - 3600, // Delete older than 1 hour
  scope: 'timeseries' // timeseries | client | shared | server
});
```

### Dashboard Operations

#### Get All Dashboards
```javascript
const dashboards = await client.getDashboards({
  pageSize: 10,
  page: 0
});
```

#### Get Dashboard Info
```javascript
const dashboard = await client.getDashboardInfo('dashboard-id-xxx');
```

#### Make Dashboard Public
```javascript
const publicInfo = await client.makeDashboardPublic('dashboard-id-xxx');
console.log(publicInfo.publicId);
```

#### Get Public Dashboard Link
```javascript
const result = await client.getPublicDashboardLink('dashboard-id-xxx');
console.log(result.publicLink); // https://iot.facenet.vn/dashboard/xxx
console.log(result.publicId);
```

#### Remove Public Access
```javascript
await client.removeDashboardPublic('dashboard-id-xxx');
```

#### Get Public Dashboard Info (No Auth)
```javascript
const dashboardInfo = await client.getPublicDashboardInfo('public-id-xxx');
```

### User Operations

#### Get Current User Info
```javascript
const userInfo = await client.getUserInfo();
```

#### Get Tenant Users
```javascript
const users = await client.getTenantUsers({
  pageSize: 100,
  page: 0
});
```

#### Get Customer Users
```javascript
// All customer users
const users = await client.getCustomerUsers({
  pageSize: 100,
  page: 0
});

// Specific customer
const users = await client.getCustomerUsers({
  customerId: 'customer-id-xxx',
  pageSize: 100,
  page: 0
});
```

### WebSocket Subscription

#### Subscribe to Real-time Telemetry
```javascript
const ws = client.subscribe({
  entityId: 'device-id-xxx',
  cmdId: 10
}, (data) => {
  if (data) {
    console.log('Telemetry update:', data);
  } else {
    console.log('WebSocket closed');
  }
});
```

## 🧪 Test Interface

The SDK includes a built-in web interface for testing all features:

```bash
cd test
npm install
npm start
```

Open `http://localhost:3009` in your browser.

### Features:
- 🔐 Authentication testing
- 📱 Device operations
- 📊 Dashboard management
- 👥 User management
- 🔗 Public dashboard links
- 📺 Dashboard viewer modal
- 🔌 WebSocket monitoring

## 📝 Callback Pattern

All methods support optional callbacks:

```javascript
client.getTenantDevices(params, (devices) => {
  console.log('Devices:', devices);
});

// Or use async/await
const devices = await client.getTenantDevices(params);
```

## 🔌 Disconnect

```javascript
client.disconnect();
```

## 🎯 Complete Example

```javascript
const tbClient = require('thingsboard-js-sdk');

async function main() {
  // Initialize client
  const client = new tbClient({
    host: 'iot.facenet.vn',
    username: 'user@example.com',
    password: 'password'
  });

  try {
    // Connect
    const result = await client.connect();
    console.log('Connected:', result.token);

    // Get devices
    const devices = await client.getTenantDevices({
      pageSize: 10,
      page: 0
    });
    console.log('Devices:', devices);

    // Get device telemetry
    if (devices.length > 0) {
      const deviceId = devices[0].id.id;
      
      // Get keys
      const keys = await client.getKeys({
        entityId: deviceId,
        scope: 'timeseries'
      });
      console.log('Keys:', keys);

      // Get timeseries data
      const timeseries = await client.getTimeseries({
        entityId: deviceId,
        keys: keys.slice(0, 5),
        limit: 10
      });
      console.log('Timeseries:', timeseries);
    }

    // Get dashboards
    const dashboards = await client.getDashboards({
      pageSize: 10,
      page: 0
    });
    console.log('Dashboards:', dashboards);

    // Disconnect
    client.disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## 📱 Mobile App Example (SSO)

```javascript
// Mobile app receives token from SSO
const ssoToken = 'eyJhbGciOiJIUzUxMiJ9...';

const client = new tbClient({
  host: 'iot.facenet.vn',
  token: ssoToken
});

// Verify and connect
const result = await client.connect();
if (result) {
  console.log('User:', JSON.parse(result.user));
  
  // Use SDK normally
  const devices = await client.getTenantDevices();
  const dashboards = await client.getDashboards();
}
```

## 🌐 Browser Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/axios@0.21.1/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script>
  <script src="path/to/tbClient.js"></script>
</head>
<body>
  <script>
    const client = new tbClient({
      host: 'iot.facenet.vn',
      username: 'user@example.com',
      password: 'password'
    });

    client.connect().then(result => {
      console.log('Connected!', result);
      
      return client.getTenantDevices({ pageSize: 10, page: 0 });
    }).then(devices => {
      console.log('Devices:', devices);
    });
  </script>
</body>
</html>
```

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/hoangnv170752/thingsboard-js-sdk.git
cd thingsboard-js-sdk

# Install dependencies
npm install

# Run test interface
cd test
npm install
npm start
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- **Repository:** https://github.com/hoangnv170752/thingsboard-js-sdk
- **Original SDK:** https://github.com/acte-technology/thingsboard-js-sdk
- **ThingsBoard:** https://thingsboard.io
- **Issues:** https://github.com/hoangnv170752/thingsboard-js-sdk/issues

## 📝 Changelog

### Enhanced Features (Fork)
- ✅ SSO token authentication support
- ✅ Dashboard management APIs
- ✅ Public dashboard operations
- ✅ User and customer management
- ✅ Device info retrieval
- ✅ Enhanced test interface with modal viewer
- ✅ Custom dashboard renderer
- ✅ Comprehensive documentation

---

**Made with ❤️ for ThingsBoard IoT Platform**
