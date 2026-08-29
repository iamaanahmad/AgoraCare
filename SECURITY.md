# Security Policy

## Our Commitment

AgoraCare handles sensitive health information, and we take security seriously. We're committed to protecting user data and maintaining the highest security standards.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Send security reports to: **security@agoracare.health**

Include the following information:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths** of source file(s) related to the vulnerability
- **Location** of the affected source code (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the vulnerability
- **Suggested fix** (if you have one)

### What to Expect

1. **Acknowledgment**: We'll acknowledge your report within 48 hours
2. **Assessment**: We'll assess the vulnerability and determine severity
3. **Updates**: We'll keep you informed of our progress
4. **Resolution**: We'll work on a fix and coordinate disclosure
5. **Credit**: We'll credit you in our security advisories (if desired)

### Response Timeline

- **Critical vulnerabilities**: Patch within 7 days
- **High severity**: Patch within 14 days
- **Medium severity**: Patch within 30 days
- **Low severity**: Patch in next regular release

## Security Best Practices

### For Users

- **Keep software updated**: Always use the latest version
- **Use strong passwords**: Enable multi-factor authentication
- **Review permissions**: Only grant necessary access
- **Secure your environment**: Keep your API keys private
- **Report suspicious activity**: Contact us immediately

### For Contributors

- **Never commit secrets**: Use environment variables
- **Validate all input**: Sanitize user data
- **Use parameterized queries**: Prevent SQL injection
- **Implement proper authentication**: Use Firebase Auth
- **Follow OWASP guidelines**: Review [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **Run security scans**: Use `npm audit` before committing

## Security Features

### Current Implementation

- ✅ **End-to-end encryption** for data in transit (HTTPS)
- ✅ **Encryption at rest** via Firebase
- ✅ **Firebase Authentication** with secure session management
- ✅ **Role-based access control** (RBAC)
- ✅ **Input validation** and sanitization
- ✅ **Rate limiting** on API endpoints
- ✅ **Audit logging** for sensitive operations
- ✅ **Secure token storage** for OAuth
- ✅ **CORS configuration** to prevent unauthorized access

### Planned Enhancements

- 🔄 **HIPAA compliance** certification
- 🔄 **Penetration testing** by third-party security firm
- 🔄 **Bug bounty program** for responsible disclosure
- 🔄 **Security headers** (CSP, HSTS, etc.)
- 🔄 **Automated security scanning** in CI/CD pipeline

## Data Protection

### What We Collect

- User profile information (name, email, phone)
- Health data (medications, appointments, prescriptions)
- Voice recordings (with explicit consent)
- Usage analytics (anonymized)

### How We Protect It

- **Encryption**: AES-256 encryption at rest, TLS 1.3 in transit
- **Access control**: Strict role-based permissions
- **Data minimization**: Only collect what's necessary
- **Retention policies**: Automatic deletion of old data
- **Anonymization**: Remove PII from logs and analytics

### User Rights

Users can:
- **Access** their data at any time
- **Export** their data in standard formats
- **Delete** their account and all associated data
- **Opt-out** of data collection features

## Compliance

### Current Status

- ✅ **GDPR**: General Data Protection Regulation (EU)
- ✅ **CCPA**: California Consumer Privacy Act
- 🔄 **HIPAA**: Health Insurance Portability and Accountability Act (in progress)

### Healthcare-Specific Considerations

- **PHI Protection**: Personal Health Information is encrypted and access-controlled
- **Audit trails**: Complete logging of data access and modifications
- **Business Associate Agreements**: Available for healthcare providers
- **Data breach notification**: 72-hour notification protocol

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow coordinated disclosure:

1. **Report received**: Researcher reports vulnerability privately
2. **Validation**: We confirm and assess the issue
3. **Fix development**: We develop and test a patch
4. **Deployment**: We deploy the fix to production
5. **Public disclosure**: We publish a security advisory (90 days max)

### Hall of Fame

We recognize security researchers who help us:

- Public acknowledgment in security advisories
- Listed in our SECURITY_HALL_OF_FAME.md
- Swag and thank you notes for significant findings

## Security Contacts

- **General security inquiries**: security@agoracare.health
- **Urgent security issues**: Call our security hotline (details provided after initial contact)
- **PGP key**: Available at https://agoracare.health/.well-known/pgp-key.txt

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

## Questions?

If you have questions about our security practices, please contact security@agoracare.health.

---

**Last Updated**: November 16, 2025

Thank you for helping keep AgoraCare and our users safe! 🔒
