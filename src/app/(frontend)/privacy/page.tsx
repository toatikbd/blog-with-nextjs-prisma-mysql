import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data this blog collects, why, and how you can control it.",
};

// TODO: replace with the real address people should write to about their data.
const CONTACT_EMAIL = "privacy@example.com";
const LAST_UPDATED = "November 8, 2026";

// Static page: describes what the app actually stores (see prisma/schema.prisma).
// Update it whenever you add analytics, newsletters, ads or other data collection.
export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose max-w-none prose-neutral dark:prose-invert prose-headings:font-heading">
        <p>
          This policy explains what personal data this blog collects when you read, sign up, comment
          or write, why we collect it, and what you can do about it. You can read every public post
          without creating an account.
        </p>

        <h2>What we collect</h2>
        <h3>When you create an account</h3>
        <ul>
          <li>
            <strong>Name and email address.</strong> Used to sign you in, show your name next to
            your comments and posts, and contact you about your account.
          </li>
          <li>
            <strong>Password.</strong> Stored only as a one-way hash (bcrypt). Nobody, including
            site staff, can read your password.
          </li>
          <li>
            <strong>GitHub sign-in (optional).</strong> If you sign in with GitHub, we receive your
            GitHub account ID, name, email address and profile picture, plus the sign-in tokens
            GitHub issues. We don&apos;t post anything to GitHub or read your repositories.
          </li>
          <li>
            <strong>Profile details (optional).</strong> A bio and profile picture, if you add them.
            These are shown on your public author profile.
          </li>
        </ul>

        <h3>When you use the site</h3>
        <ul>
          <li>
            <strong>Comments and likes.</strong> The text of your comments, the posts you like, and
            when you did so. Comments are public once approved.
          </li>
          <li>
            <strong>Posts and images.</strong> If you are an author, the posts and images you
            upload. Published posts are public.
          </li>
          <li>
            <strong>View counts.</strong> We count how many times each post is viewed. These counts
            are not linked to you.
          </li>
          <li>
            <strong>Server logs.</strong> Like most websites, our web server briefly records
            technical data such as your IP address, browser type and the pages requested, to keep
            the site secure and fix errors.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use only the cookies needed for signing in: a session cookie that keeps you logged in,
          and short-lived security cookies that protect the sign-in forms against forgery. We
          don&apos;t use advertising or tracking cookies, and we don&apos;t run third-party
          analytics.
        </p>

        <h2>How we use your data</h2>
        <ul>
          <li>To run your account and sign you in.</li>
          <li>To show your posts, comments and profile on the site.</li>
          <li>To moderate comments and keep the site free of spam and abuse.</li>
          <li>To keep the site secure and working.</li>
        </ul>
        <p>We don&apos;t sell your personal data or use it for advertising.</p>

        <h2>Who we share it with</h2>
        <p>Your data is stored on our own server and is not shared with third parties, except:</p>
        <ul>
          <li>our hosting provider, which runs the server the site and database live on;</li>
          <li>GitHub, only if you choose to sign in with GitHub;</li>
          <li>authorities, if the law requires us to.</li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          We keep your account data for as long as your account exists. When an account is deleted,
          its profile, comments, likes and posts are deleted with it. Database and file backups are
          kept for a limited time and then overwritten. Server logs are kept only as long as needed
          for security.
        </p>

        <h2>Your rights</h2>
        <p>You can:</p>
        <ul>
          <li>ask us to correct your name, email or other details;</li>
          <li>ask for a copy of the personal data we hold about you;</li>
          <li>ask us to delete your account and its data;</li>
          <li>
            object to how we use your data, or complain to your local data protection authority.
          </li>
        </ul>
        <p>
          To make a request, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>Children</h2>
        <p>
          This site is not meant for children under 13, and we don&apos;t knowingly collect their
          data.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we change how we handle personal data, we will update this page and the date at the
          top. Significant changes will be announced on the site.
        </p>

        <p>
          <Link href="/">← Back to the blog</Link>
        </p>
      </div>
    </article>
  );
}
