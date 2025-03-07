import Link from "next/link";

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
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

        <h2 className="text-2xl font-bold mt-8">
          3. How We Protect Your Information
        </h2>
        <p>
          We implement{" "}
          <strong>industry-standard encryption and security measures</strong> to
          protect your data. However,{" "}
          <strong>no online service is 100% secure</strong>.
        </p>

        <h2 className="text-2xl font-bold mt-8">
          4. Data Sharing & Third Parties
        </h2>
        <p>
          We <strong>may share</strong> data with:
        </p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Service providers</strong> (hosting, analytics, payment
            processing).
          </li>
          <li>
            <strong>Legal authorities</strong> (if required by law).
          </li>
        </ul>
        <p>
          We <strong>do not sell or trade</strong> your personal information.
        </p>

        <h2 className="text-2xl font-bold mt-8">
          5. Cookies & Tracking Technologies
        </h2>
        <p>
          We use cookies for analytics and improving your experience. You can
          disable cookies in your browser settings.
        </p>

        <h2 className="text-2xl font-bold mt-8">6. Data Retention</h2>
        <p>
          We keep your data as long as you have an account. You may request
          deletion at any time.
        </p>

        <h2 className="text-2xl font-bold mt-8">7. Your Rights</h2>
        <p>Depending on your location, you may have rights to:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Access, correct, or delete</strong> your data.
          </li>
          <li>
            <strong>Withdraw consent</strong> for data processing.
          </li>
          <li>
            <strong>Request a copy</strong> of your stored data.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">8. Third-Party Links</h2>
        <p>
          Our Service may contain links to third-party sites. We are{" "}
          <strong>not responsible</strong> for their privacy practices.
        </p>

        <h2 className="text-2xl font-bold mt-8">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy. We will notify users of significant
          changes.
        </p>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-xl font-bold mb-4">Contact Information</h3>
          <p>
            For privacy concerns, please contact us at:{" "}
            <Link
              href="mailto:privacy@celesthlete.com"
              className="text-primary hover:underline"
            >
              privacy@celesthlete.com
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            This privacy policy was last updated on {currentDate} and applies to
            all users of Celesthlete.
          </p>
        </div>
      </div>
    </div>
  );
}
