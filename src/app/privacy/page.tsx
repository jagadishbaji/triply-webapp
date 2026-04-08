"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  const lastUpdated = "March 28, 2026";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-200">
      {/* Header */}
      <header className="bg-[#02180d] text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[50%] -right-[10%] w-[50%] h-[100%] rounded-full bg-green-600/10 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/">
            <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-white/5 px-0 mb-6 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" /> Data Protection
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-emerald-100/60">Last Updated: {lastUpdated}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-slate-700 space-y-8 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">1. Introduction</h2>
            <p className="mb-3">
              NammaCab Technologies ("NammaCab", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform and use our services.
            </p>
            <p>
              By accessing or using NammaCab, you consent to the data practices described in this policy. If you do not agree with the terms of this privacy policy, please do not access the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">2. Information We Collect</h2>
            <p className="mb-3">We collect information that you voluntarily provide to us when you register or request a booking:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500">
              <li><strong>Travellers (Users):</strong> Name, mobile number, email address, pickup/drop-off locations, and any special instructions provided during the booking process.</li>
              <li><strong>Operators (Agents):</strong> Business name, owner name, mobile number, email, business address, vehicle details, commercial licenses, and KYC documentation.</li>
              <li><strong>Automatically Collected Data:</strong> IP address, browser type, device type, operating system, and usage data via cookies to improve platform performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">3. How We Use Your Information</h2>
            <p className="mb-3">Having accurate information allows us to provide you with a smooth, efficient, and customized experience. We use your data to:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500">
              <li>Facilitate the creation of and secure your account.</li>
              <li>Process and transmit your booking requests to the selected vehicle Operators.</li>
              <li>Send transactional communications, such as booking confirmations, via Email, SMS, or WhatsApp.</li>
              <li>Monitor and analyze usage and trends to improve your experience with NammaCab.</li>
              <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">4. Information Sharing & Disclosure</h2>
            <p className="mb-3 font-semibold text-slate-900 bg-slate-50 p-4 border-l-4 border-green-500 rounded-r-lg">
              Core Platform Functionality: To fulfill your booking, we must share your name, contact number, pickup location, and trip details with the specific independent Operator you have chosen to book. Once this information is shared, the Operator's use of your data is governed by their own privacy practices.
            </p>
            <p className="mb-3">We may also share information in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, investigate potential violations of our policies, or protect the rights, property, and safety of others.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, such as payment processing, data analysis, email/WhatsApp delivery, and hosting services.</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-900">We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">5. Data Security & Retention</h2>
            <p className="mb-3">
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>
            <p>
              We retain personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, or as required by Indian law (such as tax and accounting regulations).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">6. Your Data Rights</h2>
            <p className="mb-3">Under applicable data protection laws in India, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500 mb-4">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data (subject to legal retention requirements).</li>
            </ul>
            <p>To exercise these rights, please contact our Grievance Officer using the details provided below.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">7. Contact & Grievance Officer</h2>
            <p className="mb-3">
              If you have questions or comments about this Privacy Policy, or wish to report a grievance regarding your data, please contact us at:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-slate-900 mb-1">Grievance Officer</p>
                <p className="text-sm">NammaCab Technologies</p>
                <p className="text-sm">Email: privacy@nammacab.in</p>
                <p className="text-sm">Phone: +91-8884856868</p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}