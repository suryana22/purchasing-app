#!/usr/bin/env python3
"""
Script untuk generate password hash yang valid dan update database
"""

import sys
import os

# Try to import bcrypt directly
try:
    import bcrypt
    
    password = "sysadmin"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    hash_str = hashed.decode('utf-8')
    
    print(f"Password: {password}")
    print(f"Hash: {hash_str}")
    print(f"\nSQL to update:")
    print(f"UPDATE users SET password = '{hash_str}' WHERE username = 'sysadmin';")
    
    # Verify it works
    if bcrypt.checkpw(password.encode('utf-8'), hashed):
        print("\n✅ Hash verification: SUCCESS")
    else:
        print("\n❌ Hash verification: FAILED")
        
except ImportError:
    print("bcrypt not installed, trying passlib...")
    try:
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
        password = "sysadmin"
        hash_str = pwd_context.hash(password)
        
        print(f"Password: {password}")
        print(f"Hash: {hash_str}")
        print(f"\nSQL to update:")
        print(f"UPDATE users SET password = '{hash_str}' WHERE username = 'sysadmin';")
        
        # Verify it works
        if pwd_context.verify(password, hash_str):
            print("\n✅ Hash verification: SUCCESS")
        else:
            print("\n❌ Hash verification: FAILED")
            
    except ImportError:
        print("Neither bcrypt nor passlib available!")
        print("Using plain password as fallback...")
        print(f"\nSQL to update:")
        print(f"UPDATE users SET password = 'sysadmin' WHERE username = 'sysadmin';")
