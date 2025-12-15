import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ChefHat, ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
                Culinary<span className="text-brand-500">AI</span>
            </h1>
            <p className="text-slate-400 text-lg">The world's first AI-powered restaurant operating system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Entry */}
            <Link to="/login?role=customer" className="group relative overflow-hidden rounded-3xl bg-white p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-brand-100 transition-transform duration-500 group-hover:scale-150"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="h-16 w-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center mb-8 shadow-lg shadow-brand-200">
                        <Utensils size={32} />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">I'm a Customer</h2>
                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        Login to your table, browse our AI-curated menu, and place your order directly to the kitchen.
                    </p>
                    
                    <div className="mt-auto flex items-center gap-3 text-brand-600 font-bold text-lg group-hover:gap-5 transition-all">
                        Dine In <ArrowRight size={24} />
                    </div>
                </div>
            </Link>

            {/* Admin Entry */}
            <Link to="/login?role=admin" className="group relative overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/50">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-slate-700 transition-transform duration-500 group-hover:scale-150"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-8 shadow-lg shadow-indigo-900/50">
                        <ChefHat size={32} />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors">Restaurant Staff</h2>
                        <span className="px-3 py-1 bg-indigo-900/50 text-indigo-200 text-xs font-bold rounded-full border border-indigo-700/50 flex items-center gap-1">
                            <Sparkles size={12} /> AI Admin
                        </span>
                    </div>
                    
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        Secure login for staff. Scan menus, manage AI photography, and control the Kitchen Display System.
                    </p>
                    
                    <div className="mt-auto flex items-center gap-3 text-indigo-400 font-bold text-lg group-hover:gap-5 transition-all">
                        Staff Login <ArrowRight size={24} />
                    </div>
                </div>
            </Link>
        </div>

        <div className="mt-12 text-center">
            <p className="text-slate-600 text-sm">Powered by Gemini 2.5 Flash & Vision Models</p>
        </div>
      </div>
    </div>
  );
};