import { SiteNav } from "@/components/site-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <SiteNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
