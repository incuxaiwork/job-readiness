import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPage = () => {
  const navigate = useNavigate();
  const lastUpdated = 'October 8, 2026';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <article className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <header className="mb-10 pb-6 border-b border-slate-200">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li><strong>Account data:</strong> Name, email, phone number, college, branch, specialization, location.</li>
                <li><strong>Academic records:</strong> 10th/12th marks, CGPA, degree, graduation year, backlogs.</li>
                <li><strong>Assessment data:</strong> Submissions, code, answers, proctoring telemetry (face presence, tab focus).</li>
                <li><strong>AI interview data:</strong> Audio/video recordings, transcripts, AI-generated evaluations.</li>
                <li><strong>Technical data:</strong> IP address, browser type, device info, usage logs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and personalize the Platform (assessments, interviews, dashboards).</li>
                <li>Evaluate your submissions and generate reports.</li>
                <li>Run AI-powered mock interviews and proctoring.</li>
                <li>Communicate with you (account updates, results, support).</li>
                <li>Improve our services, develop new features, and ensure security.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Sharing</h2>
              <p>We do not sell your personal data. We may share information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li><strong>Service providers:</strong> Cloud hosting (Railway), databases, email, AI APIs (Google Gemini, Groq), TTS (ElevenLabs).</li>
                <li><strong>Employers/recruiters:</strong> Only with your explicit consent when you apply to opportunities.</li>
                <li><strong>Legal authorities:</strong> When required by law or to protect rights/safety.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Retention</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account data: Retained while your account is active.</li>
                <li>Assessment/interview data: Retained for 2 years for analytics and verification.</li>
                <li>Proctoring telemetry: Retained for 90 days.</li>
                <li>You may request deletion (see "Your Rights" below).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Your Rights (India DPDP Act / GDPR-aligned)</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete data.</li>
                <li><strong>Deletion:</strong> Request erasure (subject to legal retention).</li>
                <li><strong>Portability:</strong> Receive your data in a structured format.</li>
                <li><strong>Objection:</strong> Object to certain processing.</li>
                <li><strong>Withdraw consent:</strong> Where processing is based on consent.</li>
              </ul>
              <p>To exercise these rights, email <a href="mailto:privacy@readysetjob.com" className="text-brand-600 hover:underline">privacy@readysetjob.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Security</h2>
              <p>
                We implement appropriate technical and organizational measures: encryption in transit (TLS 1.2+), at rest (AES-256), hashed passwords (bcrypt), JWT authentication, rate limiting, and regular security reviews. No internet transmission is 100% secure; we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cookies and Tracking</h2>
              <p>
                We use essential cookies for authentication (HttpOnly, Secure, SameSite=Strict) and session management. We do not use third-party advertising cookies. Analytics are first-party only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. International Transfers</h2>
              <p>
                Your data may be processed on servers located outside India (e.g., cloud providers in Singapore, US, EU). We ensure appropriate safeguards (standard contractual clauses, adequacy decisions) per applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Children's Privacy</h2>
              <p>
                The Platform is not directed to individuals under 18. We do not knowingly collect data from children. If you believe we have collected data from a minor, contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Policy. The "Last updated" date reflects the latest revision. Material changes will be communicated via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contact</h2>
              <p>
                For privacy concerns or to exercise your rights, contact our Data Protection Officer at <a href="mailto:privacy@readysetjob.com" className="text-brand-600 hover:underline">privacy@readysetjob.com</a>.
              </p>
            </section>
          </div>
        </article>

        <footer className="mt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} ReadySetJob. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};