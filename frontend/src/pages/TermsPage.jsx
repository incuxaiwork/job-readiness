import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsPage = () => {
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
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the ReadySetJob platform ("Platform", "Service", "we", "us", or "our"), you ("User", "Candidate", or "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Eligibility</h2>
              <p>
                You must be at least 18 years old and legally capable of entering into contracts to use this Platform. By registering, you represent and warrant that you meet these requirements and that all information you provide is accurate, current, and complete.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Account Registration</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must provide truthful information during registration and keep it updated.</li>
                <li>You are responsible for all activities that occur under your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Assessments and Interviews</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Assessments are designed to evaluate your job readiness and technical skills.</li>
                <li>AI Mock Interviews use automated systems for evaluation and feedback.</li>
                <li>Results are for guidance purposes and do not guarantee employment.</li>
                <li>You may not share, reproduce, or distribute assessment content.</li>
                <li>Proctoring measures (face detection, tab monitoring) may be used during assessments.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Intellectual Property</h2>
              <p>
                All content on the Platform (questions, code, designs, text, graphics, logos, software) is owned by or licensed to ReadySetJob and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without explicit written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Attempt to gain unauthorized access to any portion of the Platform.</li>
                <li>Use automated tools to scrape, crawl, or extract data.</li>
                <li>Interfere with the security or integrity of assessments.</li>
                <li>Impersonate another user or provide false credentials.</li>
                <li>Use the Platform for any illegal or unauthorized purpose.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Disclaimers</h2>
              <p>
                The Platform is provided "as is" and "as available" without warranties of any kind. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components. Assessment results and AI-generated feedback are for informational purposes only and should not be considered professional career advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ReadySetJob shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or opportunities, arising from your use of or inability to use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Termination</h2>
              <p>
                We may suspend or terminate your access to the Platform at any time, with or without cause, including for violation of these Terms. Upon termination, your right to use the Platform ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of courts in India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact</h2>
              <p>
                For questions about these Terms, contact us at <a href="mailto:support@readysetjob.com" className="text-brand-600 hover:underline">support@readysetjob.com</a>.
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