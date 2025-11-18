"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans leading-relaxed">

      {/* Heading + Back Arrow */}
      <div className="flex items-center gap-6 mb-4">
        <button onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-black" />
        </button>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>

      <p>Last Updated: [18/11/2025]</p>

      <p>
        This Privacy Policy explains how <strong>Vizzle</strong> ("App", "we", "our", "us")
        handles your information. This policy applies to all users of the Vizzle mobile application.
      </p>

      <p><strong>Company Name:</strong> Vizzle</p>
      <p><strong>Developer Name:</strong> Anshika Jaiswal</p>
      <p>
        <strong>Contact Email:</strong>{" "}
        <a href="mailto:info@vizzle.in" className="text-blue-600 underline">
          info@vizzle.in
        </a>
      </p>

      <h2 className="text-2xl font-semibold mt-8">1. Information We Collect</h2>
      <p>We collect the following information to provide and improve the App:</p>

      <h3 className="text-xl font-semibold mt-4">a. Personal Information (During Registration)</h3>
      <ul className="list-disc ml-6">
        <li>Full Name</li>
        <li>Email Address</li>
        <li>Phone Number</li>
      </ul>

      <h3 className="text-xl font-semibold mt-4">b. Uploaded Photos (Virtual Try-On)</h3>
      <p>
        When you use the virtual try-on feature, you may upload a photo. These photos are processed
        using our ML models.
      </p>
      <ul className="list-disc ml-6">
        <li>Photos are stored in encrypted form.</li>
        <li>Photos are automatically deleted after a few days.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-4">c. Usage & Device Information</h3>
      <ul className="list-disc ml-6">
        <li>Device type</li>
        <li>App usage analytics</li>
        <li>Crash logs</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8">2. How We Use Your Information</h2>
      <ul className="list-disc ml-6">
        <li>To create and authenticate your account</li>
        <li>To provide virtual try-on functionality</li>
        <li>To enhance and improve app performance</li>
        <li>To provide customer support</li>
        <li>For analytics and fraud-prevention (using App Set ID, no ads usage)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8">3. How We Protect Your Data</h2>
      <ul className="list-disc ml-6">
        <li>All data is transmitted over HTTPS</li>
        <li>User photos are stored in encrypted form</li>
        <li>Access to personal data is restricted and monitored</li>
        <li>We do not sell personal or sensitive user data</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8">4. Data Sharing</h2>
      <p>We do not share user data with advertisers or third-party trackers.</p>
      <p>Data may be shared only with:</p>
      <ul className="list-disc ml-6">
        <li>Service providers who help us operate backend services</li>
        <li>Authorities, if legally required</li>
      </ul>
      <p>We do not use any third-party SDKs that collect user data without disclosure.</p>

      <h2 className="text-2xl font-semibold mt-8">5. Data Retention</h2>
      <ul className="list-disc ml-6">
        <li>Registration data is retained as long as your account is active.</li>
        <li>Uploaded photos are stored temporarily for a few days and then deleted automatically.</li>
        <li>
          Deleted accounts result in complete deletion of personal data unless legally required for
          fraud/security.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8">6. Account Deletion</h2>
      <p>You can delete your account at any time.</p>
      <p>
        <strong>In the App:</strong> Go to <em>Profile → Delete Account</em> — all your data will be
        permanently deleted.
      </p>
      <p>
        <strong>Outside the App:</strong> Request deletion via email:
        <br />
        📧{" "}
        <a href="mailto:info@vizzle.in" className="text-blue-600 underline">
          info@vizzle.in
        </a>
      </p>

      <h2 className="text-2xl font-semibold mt-8">7. Children’s Privacy</h2>
      <p>The App is not intended for children under 13, and we do not knowingly collect their data.</p>

      <h2 className="text-2xl font-semibold mt-8">8. Use of App Set ID</h2>
      <p>We may use App Set ID for:</p>
      <ul className="list-disc ml-6">
        <li>Analytics</li>
        <li>Fraud prevention</li>
      </ul>
      <p>We do not use it for advertising or ad personalization.</p>

      <h2 className="text-2xl font-semibold mt-8">9. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy periodically. The latest version will always appear here.</p>

      <h2 className="text-2xl font-semibold mt-8">10. Contact Us</h2>
      <p>
        For questions, contact us at:
        <br />
        <a href="mailto:info@vizzle.in" className="text-blue-600 underline">
          info@vizzle.in
        </a>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
