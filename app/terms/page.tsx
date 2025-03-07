import Link from "next/link";

export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground italic">
          Last Updated: {currentDate}
        </p>

        <p className="mt-6">
          Welcome to <strong>Celesthlete</strong>! These Terms of Service
          ("Terms") govern your access and use of our fitness tracking
          application, website, and services (collectively, the "Service"). By
          accessing or using the Service, you agree to comply with these Terms.
          If you do not agree, do not use the Service.
        </p>

        <h2 className="text-2xl font-bold mt-8">1. Acceptance of Terms</h2>
        <p>
          By clicking "Continue" or accessing the Service, you confirm that you
          are at least <strong>18 years old</strong> (or have legal guardian
          consent if under 18) and agree to be bound by these Terms and our{" "}
          <strong>Privacy Policy</strong>.
        </p>

        <h2 className="text-2xl font-bold mt-8">2. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify
          users of significant changes via email or a notice on our website.
          Continued use after changes means you accept the revised Terms.
        </p>

        <h2 className="text-2xl font-bold mt-8">3. Use of the Service</h2>
        <p>You agree to:</p>
        <ul className="list-disc pl-6">
          <li>
            Use the Service for <strong>personal, non-commercial</strong>{" "}
            purposes.
          </li>
          <li>Not misuse, hack, or disrupt the platform.</li>
          <li>Provide accurate registration information.</li>
        </ul>
        <p>We reserve the right to terminate accounts violating these Terms.</p>

        <h2 className="text-2xl font-bold mt-8">
          4. Account Registration & Security
        </h2>
        <p>You are responsible for:</p>
        <ul className="list-disc pl-6">
          <li>Keeping your account login information confidential.</li>
          <li>Any activity under your account.</li>
          <li>Immediately notifying us of unauthorized use.</li>
        </ul>
        <p>
          We are not responsible for losses due to unauthorized account access.
        </p>

        <h2 className="text-2xl font-bold mt-8">5. Fitness Disclaimer</h2>
        <p>
          <strong>Celesthlete</strong> is for informational purposes only and
          does <strong>not</strong> provide medical advice. Consult a healthcare
          provider before beginning any fitness program. We are not responsible
          for injuries, health conditions, or results from workouts logged in
          the app.
        </p>

        <h2 className="text-2xl font-bold mt-8">6. Subscription & Payments</h2>
        <p>If your Service includes paid features, you agree to:</p>
        <ul className="list-disc pl-6">
          <li>Provide valid payment information.</li>
          <li>Allow us to charge applicable fees.</li>
          <li>Cancel before the next billing cycle to avoid charges.</li>
        </ul>
        <p>We do not offer refunds unless required by law.</p>

        <h2 className="text-2xl font-bold mt-8">7. Intellectual Property</h2>
        <p>
          All content, branding, and features in the Service belong to{" "}
          <strong>Celesthlete</strong>. You may <strong>not</strong> copy,
          modify, distribute, or use them without permission.
        </p>

        <h1 className="text-4xl font-bold mt-16 mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground italic">
          Last Updated: {currentDate}
        </p>

        <p className="mt-6">
          We value your privacy. This <strong>Privacy Policy</strong> explains
          how <strong>Celesthlete</strong> ("we", "us") collects, uses, and
          protects your personal information.
        </p>

        <h2 className="text-2xl font-bold mt-8">1. Information We Collect</h2>
        <p>We may collect:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Personal Information</strong> (name, email, age, payment
            details).
          </li>
          <li>
            <strong>Fitness Data</strong> (workout logs, progress, goals).
          </li>
          <li>
            <strong>Device & Usage Data</strong> (IP address, browser, device
            type).
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">
          2. How We Use Your Information
        </h2>
        <p>We use your data to:</p>
        <ul className="list-disc pl-6">
          <li>Provide, maintain, and improve our Service.</li>
          <li>Personalize your experience.</li>
          <li>Send fitness insights and updates.</li>
          <li>Process payments (if applicable).</li>
        </ul>
        <p>
          We <strong>do not sell</strong> your data.
        </p>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-xl font-bold mb-4">Agreement Confirmation</h3>
          <p>
            By clicking "Continue," you confirm that you have read and agree to
            our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="mt-8 border-t pt-8">
          <p className="text-muted-foreground">
            For any questions or concerns, please contact us at:{" "}
            <Link
              href="mailto:support@celesthlete.com"
              className="text-primary hover:underline"
            >
              support@celesthlete.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
