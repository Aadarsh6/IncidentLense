import "./globals.css";

export const metadata = { title: "IncidentLens", description: "Evidence-backed deploy failure investigation" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-zinc-200 antialiased">{children}</body>
    </html>
  );
}
