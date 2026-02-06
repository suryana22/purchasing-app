const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');
const sequelize = require('./src/config/database');

// Define associations
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

async function check() {
    try {
        const users = await User.findAll({
            include: [{
                model: Role,
                include: [Permission]
            }]
        });

        console.log('USERS:');
        users.forEach(u => {
            console.log(`- ${u.username} (${u.Role ? u.Role.name : 'No Role'})`);
            if (u.Role && u.Role.Permissions) {
                console.log(`  Permissions: ${u.Role.Permissions.map(p => p.name).join(', ')}`);
            }
        });

        const roles = await Role.findAll({
            include: [Permission]
        });
        console.log('\nROLES:');
        roles.forEach(r => {
            console.log(`- ${r.name}`);
            console.log(`  Permissions: ${r.Permissions.map(p => p.name).join(', ')}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
