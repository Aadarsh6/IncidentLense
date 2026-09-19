import "./globals.css";

export const metadata = { title: "IncidentLens", description: "Evidence-backed deploy failure investigation" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e14] font-mono text-zinc-200">{children}</body>
    </html>
  );
}