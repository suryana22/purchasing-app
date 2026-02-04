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
    const { settings } = req.body; // Array of { key, value }
    try {
        for (const item of settings) {
            await SystemSetting.upsert({
                key: item.key,
                value: item.value
            });
        }
        await logActivity(req, 'UPDATE', 'SystemSetting', null, req.body);
        res.json({ message: 'Pengaturan berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
