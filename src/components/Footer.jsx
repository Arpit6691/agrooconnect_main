import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Info, 
  ArrowUpRight, 
  X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Clean inline social icons
const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Footer = () => {
  const { user } = useContext(AuthContext);
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'help' | null

  const isFarmer = user?.role === 'farmer';
  const isTrader = user?.role === 'trader';
  const isAdmin = user?.role === 'admin';
  const isGuest = !user;

  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800 relative z-10 mt-16">
      {/* Upper Subtle Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#16A34A] to-transparent opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          
          {/* Col 1: Brand & Mission (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white group">
              <div className="p-2 bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-xl group-hover:bg-[#16A34A]/30 transition-colors">
                <Leaf className="w-6 h-6 text-[#22C55E]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">AgroConnect</span>
            </Link>
            
            <p className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">
              Empowering Agriculture Through Technology.
            </p>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Connecting farmers, traders, and technology to build a smarter, fairer, and more sustainable agricultural ecosystem.
            </p>

            {/* Direct Contact Points */}
            <div className="space-y-2.5 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#22C55E] shrink-0" />
                <a href="mailto:support@agroconnect.com" className="hover:text-white transition-colors">
                  support@agroconnect.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Pan-India Agricultural Network</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Online Agricultural Decision Support (24/7)</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-3">
              {[
                { name: 'LinkedIn', icon: LinkedInIcon, href: 'https://linkedin.com' },
                { name: 'X / Twitter', icon: TwitterIcon, href: 'https://twitter.com' },
                { name: 'GitHub', icon: GithubIcon, href: 'https://github.com' },
                { name: 'Instagram', icon: InstagramIcon, href: 'https://instagram.com' }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-[#22C55E] hover:border-[#16A34A]/50 hover:bg-slate-800 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links (Role-Adaptive) */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#16A34A] pl-2.5">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  Marketplace
                </Link>
              </li>

              {/* Farmer specific links */}
              {(isFarmer || isGuest) && (
                <li>
                  <Link to="/farmer-dashboard" className="text-slate-400 hover:text-white transition-colors">
                    Farmer Dashboard
                  </Link>
                </li>
              )}
              {isFarmer && (
                <li>
                  <Link to="/plant-disease-detection" className="text-[#22C55E] hover:text-[#4ade80] font-medium transition-colors flex items-center gap-1">
                    Plant Health <span className="text-[10px] bg-[#16A34A]/20 px-1.5 py-0.5 rounded border border-[#16A34A]/30">AI</span>
                  </Link>
                </li>
              )}

              {/* Trader specific links */}
              {(isTrader || isGuest) && (
                <li>
                  <Link to="/trader-dashboard" className="text-slate-400 hover:text-white transition-colors">
                    Trader Dashboard
                  </Link>
                </li>
              )}

              {/* Admin */}
              {isAdmin && (
                <li>
                  <Link to="/admin-dashboard" className="text-slate-400 hover:text-white transition-colors">
                    Admin Dashboard
                  </Link>
                </li>
              )}

              <li>
                <Link to="/ai-recommendation" className="text-slate-400 hover:text-white transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-slate-400 hover:text-white transition-colors">
                  Farm Weather
                </Link>
              </li>

              {isGuest && (
                <>
                  <li>
                    <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-slate-400 hover:text-white transition-colors">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Col 3: Platform Features */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#16A34A] pl-2.5">
              Features
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/marketplace" className="text-slate-400 hover:text-white transition-colors">
                  Crop Marketplace
                </Link>
              </li>
              <li>
                <Link to="/plant-disease-detection" className="text-slate-400 hover:text-white transition-colors">
                  Plant Disease Detection
                </Link>
              </li>
              {isFarmer && (
                <li>
                  <Link to="/plant-detection-history" className="text-slate-400 hover:text-white transition-colors">
                    Detection History
                  </Link>
                </li>
              )}
              <li>
                <Link to="/ai-recommendation" className="text-slate-400 hover:text-white transition-colors">
                  AI Farming Assistant
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-slate-400 hover:text-white transition-colors">
                  Live Weather Insights
                </Link>
              </li>
              {user && (
                <li>
                  <Link to="/chat" className="text-slate-400 hover:text-white transition-colors">
                    Live Deal Chat
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Support & Legal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#16A34A] pl-2.5">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => setActiveModal('help')} 
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  Help & Support
                </button>
              </li>
              <li>
                <a 
                  href="mailto:support@agroconnect.com?subject=AgroConnect%20Inquiry" 
                  className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Contact Us <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('privacy')} 
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('terms')} 
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li className="pt-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#22C55E] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure & Verified Platform</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* 8. Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AgroConnect. All rights reserved.</p>
          
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span>Built for Smarter Agriculture</span>
            <span className="text-[#22C55E]">🌱</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors">
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Privacy, Terms, and Help */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-slate-300 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-[#16A34A]/20 rounded-xl text-[#22C55E]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Privacy Policy</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  AgroConnect respects your privacy and is committed to protecting your personal data, including your crop listings, location information, and deal transactions.
                </p>
                <h4 className="font-semibold text-white text-sm pt-2">Data Collection & Use:</h4>
                <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                  <li>Account credentials and contact numbers to facilitate farmer-trader connections.</li>
                  <li>Uploaded plant images used exclusively for AI disease diagnostic processing.</li>
                  <li>No farmer crop or pricing data is sold to third parties.</li>
                </ul>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Terms & Conditions</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  By accessing AgroConnect, farmers and traders agree to trade authentically and adhere to agreed deal specifications and fair pricing.
                </p>
                <h4 className="font-semibold text-white text-sm pt-2">Key Guidelines:</h4>
                <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                  <li>Crops listed must accurately reflect harvest quantity, quality, and location.</li>
                  <li>AI recommendations and disease detection outputs serve as decision-support tools.</li>
                  <li>Deals negotiated through AgroConnect require mutual verification upon delivery.</li>
                </ul>
              </div>
            )}

            {activeModal === 'help' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-[#16A34A]/20 rounded-xl text-[#22C55E]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Help & Support</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Need assistance with your listings, offers, deals, or plant disease scans? Our support team is available online to assist you.
                </p>
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2 text-sm">
                  <p className="text-white font-medium">📧 Email Support:</p>
                  <a href="mailto:support@agroconnect.com" className="text-[#22C55E] hover:underline">
                    support@agroconnect.com
                  </a>
                  <p className="text-slate-400 text-xs pt-1">Response time: Within 24 hours.</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
