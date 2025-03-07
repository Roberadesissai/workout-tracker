import Navbar from "@/components/Navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
    </>
  );
}
