const SystemSetting = require('../models/SystemSetting');
const { logActivity } = require('../utils/audit');

exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    const { settings } = req.body;
    console.log('Update settings request received:', req.body);
    try {
        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({ error: 'Format pengaturan tidak valid (harus array settings)' });
        }

        for (const item of settings) {
            console.log(`Upserting setting: ${item.key} = ${item.value}`);
            await SystemSetting.upsert({
                key: item.key,
                value: item.value
            });
        }
        await logActivity(req, 'UPDATE', 'SystemSetting', null, req.body);
        res.json({ message: 'Pengaturan berhasil diperbarui' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Gagal update database: ' + error.message });
    }
};
