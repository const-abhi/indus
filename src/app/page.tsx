import Link from "next/link";
import { BookOpen, Users, FileCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
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
            className="text-sm bg-white text-[#1a1a2e] font-medium px-5 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          Open for enrolment
        </div>

        <h1 className="font-serif text-6xl md:text-7xl tracking-tight mb-6 max-w-3xl leading-[1.05]">
          Assignments,{" "}
          <span className="italic text-white/50">simplified.</span>
        </h1>

        <p className="text-white/50 text-lg max-w-lg mb-10 leading-relaxed">
          Indus helps teachers create and track assignments, while students
          submit their work — all in one clean, structured platform.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-white text-[#1a1a2e] font-medium px-7 py-3.5 rounded-lg hover:bg-white/90 transition-colors text-sm"
          >
            Create an account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-white/20 text-white/80 font-medium px-7 py-3.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-white/10 px-8 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: "Assign tasks",
              desc: "Teachers create structured assignments with due dates, subjects, and detailed descriptions.",
            },
            {
              icon: FileCheck,
              title: "Submit work",
              desc: "Students upload PDFs, Word docs, and images directly from their browser. No email needed.",
            },
            {
              icon: Users,
              title: "Track progress",
              desc: "See submission status at a glance. Know who's submitted, who's pending, and who's late.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/70" />
              </div>
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo credentials */}
      <section className="border-t border-white/10 px-8 py-10 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-4">
            Demo accounts
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400/70" />
              <span>Teacher: <code className="text-white/80">teacher@indus.edu</code> / <code className="text-white/80">password123</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400/70" />
              <span>Student: <code className="text-white/80">student1@indus.edu</code> / <code className="text-white/80">password123</code></span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Indus. Built with Next.js, Prisma &amp; UploadThing.
      </footer>
    </div>
  );
}
