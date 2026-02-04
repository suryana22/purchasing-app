const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { authenticateToken, checkPermission } = require('../config/auth');

router.get('/backup', authenticateToken, checkPermission('database.backup'), (req, res) => {
    const fileName = `backup-${new Date().toISOString().slice(0, 10)}.sql`;
    const filePath = path.join('/tmp', fileName);

    const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = process.env;

    // Construct the dump command
    const command = `PGPASSWORD='${DB_PASSWORD}' pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME} > ${filePath}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup error: ${error}`);
            return res.status(500).json({ error: 'Gagal membuat backup database. Pastikan postgres-client terinstal.' });
        }

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error(`Download error: ${err}`);
            }
            // Cleanup: remove the temporary file
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (unlinkErr) {
                console.error(`Cleanup error: ${unlinkErr}`);
            }
        });
    });
});

// Get system config
router.get('/config', authenticateToken, (req, res) => {
    res.json({
        ENVIRONMENT: process.env.ENV_NAME || 'production',
        DB_NAME: process.env.DB_NAME
    });
});

// Update system config (Mock)
router.post('/config', authenticateToken, checkPermission('database.backup'), (req, res) => {
    res.json({ message: 'Konfigurasi diperbarui', newEnv: req.body.ENVIRONMENT });
});

module.exports = router;
