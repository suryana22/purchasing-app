const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Routes
app.use('/api', routes);

const User = require('./models/User');
const CompanySetting = require('./models/CompanySetting');
const Role = require('./models/Role');
const Permission = require('./models/Permission');

// Associations
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Database sync and server start (Using alter: true to ensure new columns/tables are created)
sequelize.sync({ alter: true })
    .then(async () => {
        console.log('Database synced');

        // IMPORTANT: Log starting seed
        console.log('Refining permissions...');

        // Seed Granular Permissions (Menu + CRUD)
        const modules = [
            { id: 'users', name: 'Manajemen Pengguna' },
            { id: 'roles', name: 'Role & Izin' },
            { id: 'departments', name: 'Master Departemen' },
            { id: 'partners', name: 'Master Rekanan/Vendor' },
            { id: 'items', name: 'Master Barang' },
            { id: 'orders', name: 'Pemesanan Barang' },
            { id: 'companies', name: 'Identitas Perusahaan' },
            { id: 'settings', name: 'Konfigurasi Sistem' },
            { id: 'special_items', name: 'Barang Khusus' },
            { id: 'item_types', name: 'Jenis Persediaan' }
        ];

        const actions = [
            { id: 'view', name: 'Melihat' },
            { id: 'create', name: 'Menambah' },
            { id: 'edit', name: 'Mengubah' },
            { id: 'delete', name: 'Menghapus' },
            { id: 'approve', name: 'Menyetujui' }
        ];

        const allPermissions = [];
        for (const mod of modules) {
            for (const action of actions) {
                allPermissions.push({
                    name: `${mod.id}.${action.id}`,
                    description: `${action.name} di ${mod.name}`
                });
            }
        }
        allPermissions.push({ name: 'orders.special', description: 'Membuat Pesanan Khusus (Luar Master)' });
        allPermissions.push({ name: 'orders.analysis', description: 'Membuat Analisa Teknis Permintaan' });

        for (const p of allPermissions) {
            await Permission.findOrCreate({ where: { name: p.name }, defaults: p });
        }

        // Seed Roles
        const [adminRole] = await Role.findOrCreate({
            where: { name: 'administrator' },
            defaults: { description: 'Akses penuh ke seluruh fitur sistem' }
        });

        const [staffRole] = await Role.findOrCreate({
            where: { name: 'staff' },
            defaults: { description: 'Akses operasional dasar' }
        });

        const [itSupportRole] = await Role.findOrCreate({
            where: { name: 'it support' },
            defaults: { description: 'Teknisi dan Analis IT' }
        });

        // Assign all permissions to admin
        const allPerms = await Permission.findAll();
        await adminRole.setPermissions(allPerms);

        // Assign basic permissions to staff (Only view/create/edit for some modules)
        const staffPermNames = [
            'departments.view', 'partners.view', 'items.view',
            'orders.view', 'orders.create', 'orders.edit', 'orders.special',
            'companies.view', 'special_items.view', 'special_items.create',
            'item_types.view'
        ];
        const staffPerms = await Permission.findAll({
            where: { name: staffPermNames }
        });
        await staffRole.setPermissions(staffPerms);

        // Assign permissions to IT Support (similar to staff + analysis permission)
        const itSupportPermNames = [
            'departments.view', 'departments.create', 'departments.edit',
            'partners.view', 'partners.create', 'partners.edit',
            'items.view',
            'orders.view', 'orders.create', 'orders.edit', 'orders.analysis',
            'companies.view', 'companies.create', 'companies.edit',
            'users.view', 'users.create', 'users.edit',
            'item_types.view'
        ];
        const itSupportPerms = await Permission.findAll({
            where: { name: itSupportPermNames }
        });
        await itSupportRole.setPermissions(itSupportPerms);

        // Seed default admin user
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'admin', // In production, hash this!
                first_name: 'Super',
                last_name: 'Admin',
                role_id: adminRole.id
            });
            console.log('Default admin user created');
        }

        app.listen(PORT, () => {
            console.log(`Master Data Service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });
