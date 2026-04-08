"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" /> Legal Documentation
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Terms and Conditions</h1>
          <p className="text-emerald-100/60">Last Updated: {lastUpdated}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-slate-700 space-y-8 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">1. Introduction & Platform Status</h2>
            <p className="mb-3">
              Welcome to NammaCab. These Terms and Conditions govern your use of the NammaCab website, progressive web application, and related services (collectively, the "Platform").
            </p>
            <p className="mb-3 font-semibold text-slate-900 bg-slate-50 p-4 border-l-4 border-green-500 rounded-r-lg">
              Important: NammaCab operates strictly as an Information Technology Intermediary under Section 79 of the Information Technology Act, 2000. NammaCab is a technology platform that connects users ("Travellers") with independent third-party vehicle operators and travel agencies ("Operators"). NammaCab does not provide transportation services, nor does it function as a transport carrier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">2. No Employer-Employee Relationship</h2>
            <p>
              The Operators, drivers, and fleet owners listed on the Platform are independent contractors. There is no joint venture, partnership, employment, or agency relationship created between you, NammaCab, or any Operator as a result of these Terms or use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">3. User (Traveller) Obligations</h2>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500">
              <li>You agree to provide accurate, current, and complete information during the booking process.</li>
              <li>You understand that the final fare may vary based on actual distance travelled, toll taxes, state taxes, and parking fees, which are to be settled directly with the Operator.</li>
              <li>NammaCab relies on the information provided by Operators regarding vehicle type, AC/Non-AC status, and pricing. While we strive for accuracy, we do not warrant the exact condition of the vehicle upon arrival.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">4. Operator (Agent) Obligations & Due Diligence</h2>
            <p className="mb-3">By registering as an Operator on NammaCab, you represent, warrant, and agree that:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500">
              <li>You possess all necessary commercial licenses, permits, approvals, and authority to provide transportation services in your operating region.</li>
              <li>You will maintain valid, comprehensive commercial vehicle insurance that covers third-party liability and passenger safety at all times.</li>
              <li>You are solely responsible for conducting background checks on your drivers. NammaCab bears no responsibility for the actions, omissions, or behavior of your drivers.</li>
              <li><strong>Indemnification:</strong> You agree to indemnify, defend, and hold harmless NammaCab and its affiliates from any claims, liabilities, damages, or legal actions arising out of your services, accidents, or breach of these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">5. Limitation of Liability</h2>
            <p className="mb-3 uppercase text-xs font-bold tracking-wider text-slate-400">Please read carefully</p>
            <p className="mb-3">
              To the maximum extent permitted by applicable law, NammaCab shall not be liable for any indirect, incidental, special, exemplary, punitive, or consequential damages, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-green-500 mb-4">
              <li>Personal injury, property damage, or accidents arising out of or related to the transportation services provided by the Operator.</li>
              <li>Delays, missed flights, or lost business opportunities due to vehicle breakdown, driver delay, or traffic.</li>
              <li>Any disputes regarding fares, behavior, or quality of service between the Traveller and the Operator.</li>
            </ul>
            <p>
              In the event of a dispute or emergency during a ride, the Traveller's sole legal recourse is against the Operator and their commercial vehicle insurance provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">6. Grievance Redressal</h2>
            <p className="mb-3">
              In accordance with the Consumer Protection (E-Commerce) Rules, 2020, NammaCab has a dedicated Grievance Officer. If you face severe issues with an Operator, you may report them to us, and we will take necessary platform-level action (including suspension of the Operator) to maintain platform integrity.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
              <p className="font-semibold text-slate-900">Contact Information:</p>
              <p>Email: legal@nammacab.in</p>
              <p>Phone: +91-8884856868</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in Hubballi-Dharwad, Karnataka.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}