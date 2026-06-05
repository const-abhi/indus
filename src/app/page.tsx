import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, FileCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#162936] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 relative z-20">
        <span className="font-serif text-2xl tracking-tight">Indus</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-white text-[#162936] font-medium px-5 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero with Background Image */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background Image */}
        <Image
          src="/river-bg.jpg"
          alt="Mountain river landscape"
          fill
          className="object-cover"
          priority
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/65 z-0"></div>

        {/* Hero Content - Better Spacing */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl">
          {/* Online Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-12 border border-white/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Online Now
          </div>

          {/* Main Heading - Improved Spacing & Line Height */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[1.1] mb-8 text-center">
            One solution{" "}
            <span className="italic text-white/50 block sm:inline">for all your assignments.</span>
          </h1>

          {/* Subheading - Better Spacing */}
          <p className="text-white/60 text-base sm:text-lg max-w-2xl text-center mb-12 leading-relaxed font-light">
            Maintain the flow of learning with Indus.
          </p>

          {/* CTA Buttons - Better Alignment */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full sm:w-auto">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 bg-white text-[#162936] font-semibold px-8 py-3.5 rounded-lg hover:bg-white/90 transition-colors text-sm w-full sm:w-auto"
            >
              Create an account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

     {/* Features Section */}
      <section className="border-t border-white/10 px-6 sm:px-8 py-12 relative z-20 bg-[#162936]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: "Assign Tasks",
              desc: "Assignments with due dates, subjects, and descriptions",
            },
            {
              icon: FileCheck,
              title: "Submit Work",
              desc: "Direct uploads of PDFs, Word docs, and images",
            },
            {
              icon: Users,
              title: "Track Progress",
              desc: "Detailed submission status at a glance",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="space-y-2 text-center md:text-left">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto md:mx-0">
                <Icon className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="font-semibold text-white text-base">{title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-4 text-center text-xs text-white/40 relative z-20 bg-[#162936]">
        © {new Date().getFullYear()} Abhishek Bhattacharjee (2203033) · Indus. Powered by Next.js, Prisma & UploadThing.
      </footer>
    </div>
  );
}