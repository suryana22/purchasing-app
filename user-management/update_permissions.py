from models import SessionLocal, Permission, Role
from sqlalchemy.exc import IntegrityError

def update_permissions():
    db = SessionLocal()
    try:
        # Define new permissions
        new_permissions = [
            {"name": "doctors.create", "resource": "doctors", "action": "create", "description": "Create new doctors"},
            {"name": "doctors.read", "resource": "doctors", "action": "read", "description": "View doctors"},
            {"name": "doctors.update", "resource": "doctors", "action": "update", "description": "Update doctors"},
            {"name": "doctors.delete", "resource": "doctors", "action": "delete", "description": "Delete doctors"},
            {"name": "monitor.view", "resource": "monitor", "action": "view", "description": "Access Nurse Monitor"},
            
            # Patient Permissions
            {"name": "patients.create", "resource": "patients", "action": "create", "description": "Create new patients"},
            {"name": "patients.read", "resource": "patients", "action": "read", "description": "View patients"},
            {"name": "patients.update", "resource": "patients", "action": "update", "description": "Update patients"},
            {"name": "patients.delete", "resource": "patients", "action": "delete", "description": "Delete patients"},

            # Role Permissions
            {"name": "roles.create", "resource": "roles", "action": "create", "description": "Create new roles"},
            {"name": "roles.read", "resource": "roles", "action": "read", "description": "View roles"},
            {"name": "roles.update", "resource": "roles", "action": "update", "description": "Update roles"},
            {"name": "roles.delete", "resource": "roles", "action": "delete", "description": "Delete roles"},
        ]

        # Add permissions if they don't exist
        created_permissions = []
        for perm_data in new_permissions:
            existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
            if not existing:
                print(f"Adding permission: {perm_data['name']}")
                perm = Permission(**perm_data)
                db.add(perm)
                created_permissions.append(perm)
            else:
                created_permissions.append(existing)
        
        db.commit()

        # Update Admin Role (Gets everything)
        admin_role = db.query(Role).filter(Role.name == "administrator").first()
        if admin_role:
            print("Updating administrator permissions...")
            # Re-fetch all permissions to ensure we have the latest list
            all_perms = db.query(Permission).all()
            admin_role.permissions = all_perms
        
        # Update Nurse Role (Gets monitor.view and doctors.read by default)
        nurse_role = db.query(Role).filter(Role.name == "nurse").first()
        if nurse_role:
            print("Updating nurse permissions...")
            # Get existing permissions
            current_perms = list(nurse_role.permissions)
            
            # Add new ones relevant to nurse
            for perm in created_permissions:
                if perm.name in ["monitor.view", "doctors.read"]:
                     if perm not in current_perms:
                         current_perms.append(perm)
            
            nurse_role.permissions = current_perms

        db.commit()
        print("✅ Permissions updated successfully!")

    except Exception as e:
        print(f"❌ Error updating permissions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_permissions()
