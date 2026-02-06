const express = require('express');
const { captureOrderTracking } = require('./capture');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4003;

app.get('/api/track/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    console.log(`Received tracking request for order: ${orderNumber}`);

    try {
        const imageBuffer = await captureOrderTracking(orderNumber);

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Gagal melakukan capture tracking dari Manpro. ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Tracking Service running on port ${PORT}`);
});
