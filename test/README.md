# ThingsBoard JS SDK Test Application

This is a browser-based test application for the ThingsBoard JS SDK.

## Files

- **index.html** - Main HTML page with UI for testing
- **style.css** - Styling for the application
- **config.js** - Configuration file (set your TB_CLIENT_URL here)
- **tbClient.js** - Browser-compatible version of the ThingsBoard client
- **app.js** - Application logic and event handlers
- **server.js** - Simple Node.js server to serve the app with .env support

## Setup

### Option 1: Manual Configuration (Quick Start)

1. Open `config.js` and replace the `TB_CLIENT_URL` value with your ThingsBoard server URL from the `.env` file
2. Open `index.html` directly in your browser
3. Enter your ThingsBoard credentials and start testing

### Option 2: Using Node.js Server (Recommended)

This option automatically loads the TB_CLIENT_URL from your `.env` file:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure your `.env` file in the parent directory contains:
   ```
   TB_CLIENT_URL=your-thingsboard-server.com
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser to: `http://localhost:3000`

## Features

### Authentication
- Connect to ThingsBoard using username/password
- Disconnect from the server

### Device Operations
- **Get Tenant Devices** - Retrieve a list of devices with pagination
- **Get Timeseries Keys** - Get available timeseries keys for a device
- **Get Attributes** - Retrieve device attributes
- **Get Timeseries Data** - Fetch historical timeseries data
- **Subscribe (WebSocket)** - Real-time telemetry updates via WebSocket

## Usage

1. **Connect**: Enter your ThingsBoard username and password, then click "Connect"
2. **Get Devices**: Click "Get Devices" to see your tenant's devices
3. **Device Operations**: Copy a device ID from the devices list, paste it into the "Device ID" field
4. **Test Features**: Click any of the device operation buttons to test different SDK features
5. **WebSocket**: Click "Subscribe" to receive real-time telemetry updates

## Notes

- The application uses CDN versions of axios and jwt-decode for browser compatibility
- WebSocket subscriptions will show real-time updates in a separate section
- All responses are displayed in JSON format for easy debugging
- Make sure your ThingsBoard server allows CORS requests from your domain

## Troubleshooting

- **Connection fails**: Check that your TB_CLIENT_URL is correct and accessible
- **CORS errors**: Your ThingsBoard server needs to allow requests from your origin
- **No devices shown**: Make sure your account has devices and proper permissions
- **WebSocket fails**: Check that your server supports WebSocket connections
