// Browser-compatible version of tbClient
// This is adapted from the Node.js version to work in the browser

const api = (host, token = null) => axios.create({
    baseURL: `https://${host}`,
    responseType: "json",
    headers: {
        'X-Authorization': `Bearer ${token}`
    }
});

class tbClient {

    constructor(config) {
        this.config = config;
        this.api = api(config.host, config.token);

        if (config.token) {
            this.token = config.token;
        } else {
            this.token = null;
        }
    }

    async connect(isPublic = false) {
        let result;

        if (isPublic === true) {
            result = await this.api.post('/api/auth/login/public', { publicId: this.config.publicId })
                .then(function (response) {
                    return {
                        token: response.data.token,
                        user: null
                    }
                })
                .catch(function (error) {
                    console.error('Connection error:', error);
                    return null;
                });
        } else {
            result = await this.api.post('/api/auth/login', { 
                username: this.config.username, 
                password: this.config.password 
            })
                .then(function (response) {
                    return {
                        token: response.data.token,
                        user: JSON.stringify(jwt_decode(response.data.token))
                    };
                })
                .catch(function (error) {
                    console.error('Connection error:', error);
                    return null;
                });
        }

        if (result) {
            this.token = result.token;
            this.api = api(this.config.host, result.token);
            return result;
        } else {
            return null;
        }
    }

    // Disconnect
    disconnect() {
        this.token = null;
        return null;
    }

    // Get tenant devices
    getTenantDevices(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;
        const sortProperty = params.sortProperty || 'name';
        const sortOrder = params.sortOrder || 'ASC';

        return this.api.get(`/api/tenant/devices?pageSize=${pageSize}&page=${page}&sortProperty=${sortProperty}&sortOrder=${sortOrder}`)
            .then(function (response) {
                callback && callback(response.data.data);
                return response.data.data;
            })
            .catch(function (error) {
                console.log(error);
                callback && callback(null);
                return null;
            });
    }

    // Get timeseries keys|attributes keys
    async getKeys(params, callback = null) {
        const entityId = params.entityId;

        if (!entityId) {
            console.error('entityId is undefined');
            callback && callback(null);
            return null;
        }

        const scope = params.scope || 'timeseries';

        const keysFunction = (args) => {
            return this.api.get(`/api/plugins/telemetry/DEVICE/${args.entityId}/keys/${args.scope}`)
                .then(function (response) {
                    callback && callback(response.data);
                    return response.data;
                })
                .catch(function (error) {
                    callback && callback(null);
                    return null;
                });
        }

        switch (scope) {
            case 'client':
                params.scope = 'attributes/CLIENT_SCOPE';
                return keysFunction(params);

            case 'shared':
                params.scope = 'attributes/SHARED_SCOPE';
                return keysFunction(params);

            case 'server':
                params.scope = 'attributes/SERVER_SCOPE';
                return keysFunction(params);

            case 'timeseries':
                params.scope = 'timeseries';
                return keysFunction(params);

            default:
                params.scope = 'timeseries';
                return keysFunction(params);
        }
    }

    // Get attributes by scope
    getAttributesByScope(params, callback = null) {
        const entityId = params.entityId;
        if (!entityId) {
            console.log('undefined entityId');
            callback(null);
            return null;
        }

        const scope = params.scope || 'CLIENT_SCOPE';

        return this.api.get(`/api/plugins/telemetry/DEVICE/${params.entityId}/values/attributes/${scope}?keys=${params.keys.join(',')}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                callback && callback(null);
                return null;
            });
    }

    async deleteEntityKeys(params, callback = null) {
        const entityId = params.entityId;
        const keys = params.keys || [];
        const scope = params.scope || "";
        const olderThan = Number(params.olderThan || 0);

        const baseUrl = `https://${this.config.host}/api/plugins/telemetry/DEVICE/${entityId}`;
        let url;

        switch (scope) {
            case 'timeseries':
                if (olderThan === 0) {
                    url = `${baseUrl}/timeseries/delete?keys=${keys.join(',')}&deleteAllDataForKeys=true`;
                } else {
                    const startTs = 0;
                    const endTs = Date.now() - (olderThan * 1000);
                    url = `${baseUrl}/timeseries/delete?keys=${keys.join(',')}&startTs=${startTs}&endTs=${endTs}&&deleteAllDataForKeys=false`;
                }
                break;
            case 'client':
                url = `${baseUrl}/CLIENT_SCOPE?keys=${keys.join(',')}`;
                break;
            case 'shared':
                url = `${baseUrl}/SHARED_SCOPE?keys=${keys.join(',')}`;
                break;
            case 'server':
                url = `${baseUrl}/SERVER_SCOPE?keys=${keys.join(',')}`;
                break;
            default:
                console.error('Unrecognized scope');
                return null;
        }

        try {
            let response = await fetch((url), {
                method: "DELETE",
                headers: {
                    'X-Authorization': `Bearer ${this.token}`
                }
            });

            callback && callback(response);
            return response;
        } catch (e) {
            console.error(e);
            callback && callback(null);
            return null;
        }
    }

    getTimeseries(params, callback = null) {
        const now = Date.now();
        const entityId = params.entityId;
        const keys = params.keys || [];
        const limit = params.limit || 500;
        const agg = params.agg || 'AVG';
        const interval = params.interval || 60000;
        const startTs = params.startTs || now - 3600000;
        const endTs = params.endTs || now;
        const useStrictDataTypes = params.useStrictDataTypes || true;

        const getParams = {
            keys: keys.join(','),
            limit: limit,
            agg: agg,
            interval: interval,
            startTs: startTs,
            endTs: endTs,
            useStrictDataTypes: useStrictDataTypes
        }

        return this.api.get(
            `/api/plugins/telemetry/DEVICE/${entityId}/values/timeseries`, { params: getParams })
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.log(error);
                callback && callback(null);
                return null;
            });
    }

    // WebSocket subscription
    subscribe(params, callback) {
        const entityId = params.entityId;
        const cmdId = params.cmdId || 10;

        const wssUrl = `wss://${this.config.host}/api/ws/plugins/telemetry?token=${this.token}`;
        var webSocket = new WebSocket(wssUrl);

        webSocket.onopen = function () {
            var object = {
                tsSubCmds: [
                    {
                        entityType: "DEVICE",
                        entityId: entityId,
                        scope: "LATEST_TELEMETRY",
                        cmdId: cmdId
                    }
                ],
                historyCmds: [],
                attrSubCmds: []
            };
            var data = JSON.stringify(object);
            webSocket.send(data);
        };

        webSocket.onmessage = function (event) {
            var received_msg = event.data;
            callback(JSON.parse(received_msg));
        };

        webSocket.onclose = function () {
            console.log('WEBSOCKET CLOSED');
            webSocket = null;
            callback(null);
        };

        return webSocket;
    }

    // Get device info by ID
    getDeviceInfo(deviceId, callback = null) {
        if (!deviceId) {
            console.error('deviceId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.get(`/api/device/${deviceId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error fetching device info:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get all dashboards
    getDashboards(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;
        const sortProperty = params.sortProperty || 'title';
        const sortOrder = params.sortOrder || 'ASC';

        return this.api.get(`/api/tenant/dashboards?pageSize=${pageSize}&page=${page}&sortProperty=${sortProperty}&sortOrder=${sortOrder}`)
            .then(function (response) {
                callback && callback(response.data.data);
                return response.data.data;
            })
            .catch(function (error) {
                console.error('Error fetching dashboards:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get dashboard info by ID
    getDashboardInfo(dashboardId, callback = null) {
        if (!dashboardId) {
            console.error('dashboardId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.get(`/api/dashboard/${dashboardId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error fetching dashboard info:', error);
                callback && callback(null);
                return null;
            });
    }

    // Make dashboard public and get public link
    makeDashboardPublic(dashboardId, callback = null) {
        if (!dashboardId) {
            console.error('dashboardId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.post(`/api/customer/public/dashboard/${dashboardId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error making dashboard public:', error);
                callback && callback(null);
                return null;
            });
    }

    // Remove public access from dashboard
    removeDashboardPublic(dashboardId, callback = null) {
        if (!dashboardId) {
            console.error('dashboardId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.delete(`/api/customer/public/dashboard/${dashboardId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error removing public dashboard:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get public dashboard info (no authentication required)
    getPublicDashboardInfo(publicId, callback = null) {
        if (!publicId) {
            console.error('publicId is undefined');
            callback && callback(null);
            return null;
        }

        // Create API instance without token for public access
        const publicApi = axios.create({
            baseURL: `https://${this.config.host}`,
            responseType: "json"
        });

        return publicApi.get(`/api/dashboard/info/${publicId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error fetching public dashboard info:', error);
                callback && callback(null);
                return null;
            });
    }

    // Assign dashboard to public customer
    assignDashboardToPublicCustomer(dashboardId, callback = null) {
        if (!dashboardId) {
            console.error('dashboardId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.post(`/api/customer/public/dashboard/${dashboardId}`)
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error assigning dashboard to public customer:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get public dashboard link
    getPublicDashboardLink(dashboardId, callback = null) {
        if (!dashboardId) {
            console.error('dashboardId is undefined');
            callback && callback(null);
            return null;
        }

        return this.api.post(`/api/customer/public/dashboard/${dashboardId}`)
            .then((response) => {
                console.log('Public dashboard response:', response.data);
                
                // Extract publicId from different possible locations
                let publicId = response.data.publicId || 
                              response.data.id?.id || 
                              response.data.id ||
                              dashboardId;
                
                const publicLink = `https://${this.config.host}/dashboard/${publicId}`;
                const result = {
                    ...response.data,
                    publicId: publicId,
                    publicLink: publicLink,
                    dashboardId: dashboardId
                };
                callback && callback(result);
                return result;
            })
            .catch(function (error) {
                console.error('Error getting public dashboard link:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get current user info
    getUserInfo(callback = null) {
        return this.api.get('/api/auth/user')
            .then(function (response) {
                callback && callback(response.data);
                return response.data;
            })
            .catch(function (error) {
                console.error('Error fetching user info:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get all users (requires admin privileges)
    getUsers(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;
        const sortProperty = params.sortProperty || 'email';
        const sortOrder = params.sortOrder || 'ASC';

        return this.api.get(`/api/users?pageSize=${pageSize}&page=${page}&sortProperty=${sortProperty}&sortOrder=${sortOrder}`)
            .then(function (response) {
                callback && callback(response.data.data);
                return response.data.data;
            })
            .catch(function (error) {
                console.error('Error fetching users:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get tenant users
    getTenantUsers(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;

        return this.api.get(`/api/tenant/users?pageSize=${pageSize}&page=${page}`)
            .then(function (response) {
                callback && callback(response.data.data);
                return response.data.data;
            })
            .catch(function (error) {
                console.error('Error fetching tenant users:', error);
                callback && callback(null);
                return null;
            });
    }

    // Get customer users
    getCustomerUsers(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;
        const customerId = params.customerId;

        // If customerId is provided, get users for specific customer
        // Otherwise, get all customers and their users
        if (customerId) {
            return this.api.get(`/api/customer/${customerId}/users?pageSize=${pageSize}&page=${page}`)
                .then(function (response) {
                    callback && callback(response.data.data);
                    return response.data.data;
                })
                .catch(function (error) {
                    console.error('Error fetching customer users:', error);
                    callback && callback(null);
                    return null;
                });
        } else {
            // Get all customers first, then get their users
            return this.api.get(`/api/customers?pageSize=100&page=0`)
                .then(async (response) => {
                    const customers = response.data.data;
                    if (!customers || customers.length === 0) {
                        callback && callback([]);
                        return [];
                    }

                    // Get users for all customers
                    const allUsers = [];
                    for (const customer of customers) {
                        try {
                            const userResponse = await this.api.get(`/api/customer/${customer.id.id}/users?pageSize=${pageSize}&page=${page}`);
                            if (userResponse.data.data) {
                                allUsers.push(...userResponse.data.data);
                            }
                        } catch (error) {
                            console.error(`Error fetching users for customer ${customer.id.id}:`, error);
                        }
                    }

                    callback && callback(allUsers);
                    return allUsers;
                })
                .catch(function (error) {
                    console.error('Error fetching customers:', error);
                    callback && callback(null);
                    return null;
                });
        }
    }
}
