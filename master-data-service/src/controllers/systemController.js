const os = require('os');
const { Op } = require('sequelize');
const ActivityLog = require('../models/ActivityLog');
const SystemSetting = require('../models/SystemSetting');
const DB = require('../config/database');

exports.getSystemHealth = async (req, res) => {
    try {
        // Log Activity for Active Users tracking
        if (req.user) {
            // Only log if not logged recently? No, simple insert.
            // To prevent bloat, maybe check? But for now, user asked "Active user not detected".
            // We need entries in ActivityLog.
            // We can use a specific action 'HEARTBEAT' or just 'VIEW'.
            // My ActivityLog model has ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN').
            // I'll use 'VIEW'.

            // Check if we logged recently (e.g. last 1 min) to avoid spam from 30s polling
            const lastLog = await ActivityLog.findOne({
                where: {
                    user_id: req.user.id,
                    created_at: { [Op.gte]: new Date(Date.now() - 60 * 1000) }
                }
            });

            if (!lastLog) {
                await ActivityLog.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action: 'VIEW',
                    module: 'DASHBOARD',
                    details: 'System Status Check',
                    ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
                });
            }
        }

        // 1. SOLR Monitoring (Simulated as requested by user)
        const solrUptime = '99.98%';
        const solrLatency = Math.floor(Math.random() * 40) + 10;
        const solrStatus = 'HEALTHY';

        // 2. Application Server Status
        const serverStats = {
            platform: os.platform(),
            uptime: Math.floor(os.uptime()),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)
            },
            cpu: {
                load: os.loadavg()[0].toFixed(2),
                cores: os.cpus().length
            }
        };

        // 3. Purchasing Service Health
        let purchasingStatus = 'UNKNOWN';
        let purchasingLatency = 0;
        try {
            const startP = Date.now();
            // Try service name first (Docker network)
            const serviceUrl = process.env.PURCHASING_SERVICE_URL || 'http://purchasing-service:4002/';
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            await fetch(serviceUrl, { method: 'HEAD', signal: controller.signal });
            clearTimeout(id);
            purchasingLatency = Date.now() - startP;
            purchasingStatus = 'HEALTHY';
        } catch (e) {
            // Fallback to localhost if not in docker (for local dev)
            try {
                const startP2 = Date.now();
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 2000);
                await fetch('http://localhost:4002/', { method: 'HEAD', signal: controller.signal });
                clearTimeout(id);
                purchasingLatency = Date.now() - startP2;
                purchasingStatus = 'HEALTHY';
            } catch (e2) {
                purchasingStatus = 'DOWN';
                // console.error('Purchasing Service check error:', e2.message);
            }
        }

        // 4. Manpro Connection (Direct Ping)
        let manproStatus = 'UNKNOWN';
        let manproLatency = 0;
        try {
            const settings = await SystemSetting.findAll({
                where: { key: 'manpro_url' }
            });
            const manproUrl = settings.length > 0 ? settings[0].value : 'https://manpro.systems';

            console.log(`[Health Check] Pinging Manpro at: ${manproUrl}`);

            if (manproUrl) {
                const start = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                };

                try {
                    await fetch(manproUrl, {
                        method: 'HEAD',
                        signal: controller.signal,
                        headers
                    });
                    manproLatency = Date.now() - start;
                    manproStatus = 'CONNECTED';
                } catch (e) {
                    // Try GET
                    console.warn(`[Health Check] Manpro HEAD failed (${e.message}). Retrying with GET...`);
                    try {
                        await fetch(manproUrl, {
                            method: 'GET',
                            signal: controller.signal,
                            headers
                        });
                        manproLatency = Date.now() - start;
                        manproStatus = 'CONNECTED';
                    } catch (e2) {
                        console.error(`[Health Check] Manpro GET failed: ${e2.message}`);
                        throw e2;
                    }
                }
                clearTimeout(timeoutId);
            }
        } catch (error) {
            manproStatus = 'DISCONNECTED';
            console.error('[Health Check] Manpro Overall Error:', error.message);
        }

        // 5. Active Users
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const activeUsersCount = await ActivityLog.count({
            distinct: true,
            col: 'user_id',
            where: {
                created_at: {
                    [Op.gte]: fifteenMinutesAgo
                }
            }
        });

        // 5. Database Health
        let dbStatus = 'CONNECTED';
        try {
            await DB.authenticate();
        } catch (e) {
            dbStatus = 'DISCONNECTED';
        }

        res.json({
            solr: {
                status: solrStatus,
                latency: `${solrLatency}ms`,
                uptime: solrUptime
            },
            server: serverStats,
            purchasing: {
                status: purchasingStatus,
                latency: `${purchasingLatency}ms`
            },
            manpro: {
                status: manproStatus,
                latency: `${manproLatency}ms`
            },
            users: {
                active: activeUsersCount
            },
            database: {
                status: dbStatus
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('System health check error:', error);
        res.status(500).json({ error: error.message });
    }
};
