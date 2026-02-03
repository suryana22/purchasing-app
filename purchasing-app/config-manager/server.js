const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 9999;

// Path to the main application's .env file
const envFilePath = path.join(__dirname, '../.env');
const dockerComposePath = path.join(__dirname, '..');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get current config
app.get('/api/config', (req, res) => {
    try {
        if (!fs.existsSync(envFilePath)) {
            return res.status(500).json({ error: '.env file not found' });
        }

        const envContent = fs.readFileSync(envFilePath, 'utf8');
        const dbNameMatch = envContent.match(/DB_NAME=(.+)/);
        const currentDb = dbNameMatch ? dbNameMatch[1].trim() : 'purchasing_db';

        // Determine environment based on DB name
        let environment = 'custom';
        if (currentDb === 'purchasing_db_prod') environment = 'production';
        else if (currentDb === 'purchasing_dev') environment = 'development';
        else if (currentDb === 'purchasing_db') environment = 'legacy';

        res.json({ environment, currentDb });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update config
app.post('/api/config', (req, res) => {
    try {
        const { environment } = req.body;
        let dbName, envName;

        if (environment === 'production') {
            dbName = 'purchasing_db_prod';
            envName = 'production';
        } else if (environment === 'development') {
            dbName = 'purchasing_dev';
            envName = 'development';
        } else if (environment === 'legacy') {
            dbName = 'purchasing_db';
            envName = 'legacy';
        } else {
            return res.status(400).json({ error: 'Invalid environment' });
        }

        if (!fs.existsSync(envFilePath)) {
            return res.status(500).json({ error: '.env file not found' });
        }

        let envContent = fs.readFileSync(envFilePath, 'utf8');

        // Update DB_NAME
        if (envContent.includes('DB_NAME=')) {
            envContent = envContent.replace(/DB_NAME=.+/g, `DB_NAME=${dbName}`);
        } else {
            envContent += `\nDB_NAME=${dbName}`;
        }

        // Update ENV_NAME (for display/tracking)
        if (envContent.includes('ENV_NAME=')) {
            envContent = envContent.replace(/ENV_NAME=.+/g, `ENV_NAME=${envName}`);
        } else {
            envContent += `\nENV_NAME=${envName}`;
        }

        // Rotate JWT_SECRET to kill all user sessions
        const newSecret = require('crypto').randomBytes(32).toString('hex');
        if (envContent.includes('JWT_SECRET=')) {
            envContent = envContent.replace(/JWT_SECRET=.+/g, `JWT_SECRET=${newSecret}`);
        } else {
            envContent += `\nJWT_SECRET=${newSecret}`;
        }

        fs.writeFileSync(envFilePath, envContent);

        // Restart Docker Containers
        // We use exec to run docker-compose from the parent directory
        exec('docker-compose down && docker-compose up -d', { cwd: dockerComposePath }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).json({ error: 'Failed to restart services: ' + stderr });
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.json({ message: 'Configuration updated and services restarting...', dbName });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Config Manager running on http://localhost:${PORT}`);
});
