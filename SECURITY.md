# Security Policy

## Supported Versions

Only the latest version of ApplianceIQ is supported for security updates.

## Reporting a Vulnerability

If you discover a security vulnerability within ApplianceIQ, please report it to us immediately. 

Please provide:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact of the vulnerability.

We aim to respond to all security reports within 48 hours and resolve confirmed issues as quickly as possible.

## Security Architecture

- **Authentication**: JWT-based session management with secure cookies.
- **Authorization**: Role-based access control (RBAC) enforced on every API endpoint.
- **Data Protection**: Sensitive data like passwords are never stored in plain text (uses Bcrypt).
- **Environment Isolation**: Secret keys and configuration are managed via environment variables.
