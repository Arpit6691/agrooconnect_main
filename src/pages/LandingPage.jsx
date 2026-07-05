import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Shield, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 font-medium text-sm mb-6 border border-primary-100">
            <Leaf className="w-4 h-4" />
            <span>The Future of Agriculture</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Connect. Trade. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Grow Together.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
            A modern marketplace connecting farmers directly with traders. Get the best rates, AI-driven crop recommendations, and secure transactions all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-semibold transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2">
              Start Trading <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-full font-semibold transition-all shadow-md border border-slate-100">
              View Market Rates
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 relative w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-primary-50 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
          <div className="glass-card p-8 rounded-[3rem] overflow-hidden aspect-square flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary-900/5 mix-blend-multiply"></div>
            {/* Placeholder for illustration */}
            <div className="text-center z-10">
              <TrendingUp className="w-32 h-32 text-primary-500 mx-auto mb-6 opacity-80" />
              <h3 className="text-2xl font-bold text-slate-800">Smart Agriculture</h3>
              <p className="text-slate-500 mt-2">Connecting ecosystems</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why choose AgroConnect?</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">We provide the tools and network you need to succeed in modern agriculture.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "Best Market Rates", desc: "Get real-time insights and secure the highest profit margins for your crops." },
              { icon: Shield, title: "Secure Transactions", desc: "Every deal is protected with our escrow-style payment and verification system." },
              { icon: Leaf, title: "AI Recommendations", desc: "Optimize your yield with machine learning suggestions based on soil and weather." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-primary-500">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
