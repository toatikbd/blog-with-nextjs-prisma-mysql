import { SiteHeader } from "@/components/frontend/site-header";
import { SiteFooter } from "@/components/frontend/site-footer";

// Layout for the public site: header, page content, footer.
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
