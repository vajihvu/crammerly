import LegalLayout from '../components/layout/LegalLayout';

const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="March 2026">
        <section>
            <h2 className="text-xl font-bold text-white mb-3">1. What We Collect</h2>
            <p>When you create a Crammerly account, we collect your <strong>name</strong>, <strong>email address</strong>, and a hashed version of your <strong>password</strong>. If you sign in with Google, we receive your name, email, and profile picture from Google.</p>
            <p className="mt-2">We also collect data you create while using the platform: study sessions, to-dos, notes, journal entries, room memberships, and chat messages.</p>
            <p className="mt-2">We log <strong>authentication events</strong> (login, logout, password changes) for security purposes. We record your IP address and browser user-agent at login for device recognition.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>To provide and improve the Crammerly service</li>
                <li>To send you transactional emails (verification, password reset, security alerts)</li>
                <li>To detect and prevent abuse, fraud, and security incidents</li>
                <li>To aggregate anonymous usage metrics for product improvement</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Cookies & Tracking</h2>
            <p>We use a single <strong>HttpOnly session cookie</strong> to keep you logged in. This cookie is strictly necessary and does not require consent under GDPR.</p>
            <p className="mt-2">We use <strong>Plausible Analytics</strong> — a privacy-first, cookieless analytics tool — to understand aggregate page traffic. Plausible does not use cookies, does not collect personal data, and is fully GDPR-compliant without a cookie banner.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Authentication audit logs are automatically deleted after <strong>90 days</strong>. You can delete your account at any time from your profile settings.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Your Rights (GDPR)</h2>
            <p>If you are in the EU/EEA, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
                <li><strong className="text-slate-300">Right to access</strong> — Request a copy of all data we hold about you</li>
                <li><strong className="text-slate-300">Right to portability</strong> — Download a full JSON export from Profile → Settings → Export Data</li>
                <li><strong className="text-slate-300">Right to erasure</strong> — Permanently delete your account and all data from Profile → Settings → Delete Account</li>
                <li><strong className="text-slate-300">Right to rectification</strong> — Update your name and email from your profile</li>
            </ul>
            <p className="mt-3">For any other data requests, contact us at <a href="mailto:privacy@crammerly.app" className="text-indigo-400 hover:underline">privacy@crammerly.app</a>.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Third-Party Services</h2>
            <p>We use the following sub-processors:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
                <li><strong className="text-slate-300">MongoDB Atlas</strong> — Database hosting</li>
                <li><strong className="text-slate-300">Google OAuth</strong> — Optional sign-in</li>
                <li><strong className="text-slate-300">Sentry</strong> — Error monitoring</li>
                <li><strong className="text-slate-300">Plausible</strong> — Privacy-first analytics</li>
            </ul>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:privacy@crammerly.app" className="text-indigo-400 hover:underline">privacy@crammerly.app</a>.</p>
        </section>
    </LegalLayout>
);

export default PrivacyPolicy;
