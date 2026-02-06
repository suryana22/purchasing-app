# Patient Login System Documentation

## Overview
The patient login system has been centralized in the `auth-service`. It provides a QR Code-based login mechanism with a manual fallback option.

## URLs
- **Patient Login**: `http://localhost:8005/patient-login`
- **Staff Login**: `http://localhost:8005/staff-login`

## Login Page Template

### File: `templates/patient-login.html`

The login page is a responsive HTML/JS interface featuring:
1.  **Dual Login Modes**:
    - **Scan QR Code**: Uses `html5-qrcode` library to scan patient QR cards.
    - **Input Manual**: Allows manual entry of the QR token string.
2.  **Visual Design**:
    - Gradient background (`#667eea` to `#764ba2`).
    - Card-based layout with shadow effects.
    - Responsive layout for mobile and desktop.
3.  **Functionality**:
    - **QR Scanning**: accessing the camera to scan codes.
    - **Token Validation**: Submits token to `/magic-login?token=[TOKEN]`.
    - **Auto-Redirect**: On success, redirects to the customer portal.

### Dependencies
- **html5-qrcode**: For QR code scanning capabilities.

## Backup Files
Backup files have been created in the `templates/` directory:
- `templates/patient-login.html.bak` (Previous version)
- `templates/patient-qr-login.html.bak` (Original QR version)

## Integration
The `auth-service` runs on port `8005`. It communicates with `patient-service` (port `8004`) to validate tokens.

### Flow
1. User visits `/patient-login`.
2. Scans QR or enters token.
3. Frontend redirects to `/magic-login?token=...`.
4. `auth-service` calls `patient-service/auth/qr` to validate.
5. If valid, JWT is issued and stored in LocalStorage, user redirected to `/customer`.
