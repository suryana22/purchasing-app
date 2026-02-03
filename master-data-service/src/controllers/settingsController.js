const CompanySetting = require('../models/CompanySetting');

exports.getSettings = async (req, res) => {
    try {
        let settings = await CompanySetting.findOne();
        if (!settings) {
            // Create default settings if not exists
            settings = await CompanySetting.create({
                company_name: 'PT MEDIKALOKA MANAJEMEN',
                company_address: '',
                company_logo: '',
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await CompanySetting.findOne();
        if (settings) {
            await settings.update(req.body);
        } else {
            settings = await CompanySetting.create(req.body);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
