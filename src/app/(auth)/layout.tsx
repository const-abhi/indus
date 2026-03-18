import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="font-serif text-2xl tracking-tight text-[#1a1a2e]">
          Indus
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
