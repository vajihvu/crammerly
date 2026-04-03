import LegalLayout from '../components/layout/LegalLayout';

const TermsOfService = () => (
    <LegalLayout title="Terms of Service" lastUpdated="March 2026">
        <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account on Crammerly, you agree to these Terms of Service. If you do not agree, do not use the service. We may update these terms with notice; continued use constitutes acceptance.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
            <p>You must be at least <strong>13 years old</strong> to use Crammerly. If you are under 18, you must have parental consent. By using Crammerly, you represent that you meet these requirements.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Your Account</h2>
            <p>You are responsible for keeping your account credentials secure. You must notify us immediately at <a href="mailto:support@crammerly.app" className="text-indigo-400 hover:underline">support@crammerly.app</a> if you suspect unauthorized access. You are liable for all activity under your account.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
                <li>Post illegal, harmful, or abusive content in study rooms or chat</li>
                <li>Harass, threaten, or impersonate other users</li>
                <li>Attempt to reverse-engineer, attack, or exploit the platform</li>
                <li>Use automated bots or scrapers without written permission</li>
                <li>Share, sell, or distribute access to your account</li>
            </ul>
            <p className="mt-3">Violation may result in immediate account suspension or termination.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Your Content</h2>
            <p>You own the content you create (notes, journal entries, study plans). By using Crammerly, you grant us a limited license to store and display your content solely to provide the service. We do not claim ownership of your data.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Service Availability</h2>
            <p>We strive for high availability but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice where possible. We are not liable for downtime caused by third-party infrastructure (cloud hosting, database providers).</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Account Termination</h2>
            <p>You may delete your account at any time from your profile settings. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be permanently deleted in accordance with our <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>Crammerly is provided <strong>"as is"</strong> without warranties of any kind, express or implied. We do not guarantee that the service will be error-free, secure, or meet your specific requirements.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Crammerly and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Governing Law</h2>
            <p>These terms are governed by applicable laws. Any disputes will be resolved in good faith. Contact us at <a href="mailto:legal@crammerly.app" className="text-indigo-400 hover:underline">legal@crammerly.app</a> before pursuing formal legal action.</p>
        </section>
    </LegalLayout>
);

export default TermsOfService;
