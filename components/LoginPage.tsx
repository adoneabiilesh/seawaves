
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { ChefHat, Utensils, ArrowRight, Lock, User as UserIcon, MapPin, QrCode, Mail, Building } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'customer';
  const tableParam = searchParams.get('table');

  const [activeRole, setActiveRole] = useState<'admin' | 'customer'>(initialRole);
  const [isSignup, setIsSignup] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(tableParam || '');
  
  // Admin Login States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Signup States
  const [signupName, setSignupName] = useState('');
  const [signupRestaurant, setSignupRestaurant] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (tableParam) {
        setTableNumber(tableParam);
        setActiveRole('customer');
    }
  }, [tableParam]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeRole === 'admin') {
      if (isSignup) {
        // Mock Signup
        if (!signupName || !signupRestaurant || !signupEmail || !signupPassword) {
            setError("All fields are required.");
            return;
        }
        const user: User = { id: 'admin-new', name: signupName, role: 'admin' };
        onLogin(user);
        navigate('/admin');
      } else {
        // Mock Login
        if (adminPassword === 'admin123') {
            const user: User = { id: 'admin-1', name: 'Restaurant Manager', role: 'admin' };
            onLogin(user);
            navigate('/admin');
        } else {
            setError('Invalid staff password (try: admin123)');
        }
      }
    } else {
      if (!customerName || !tableNumber) {
        setError('Please fill in all fields to start dining.');
        return;
      }
      const user: User = {
        id: `cust-${Date.now()}`,
        name: customerName,
        role: 'customer',
        tableNumber: tableNumber
      };
      onLogin(user);
      navigate('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side: Visual/Context */}
        <div className={`relative md:w-1/2 p-12 flex flex-col justify-between transition-colors duration-500 ${activeRole === 'admin' ? 'bg-slate-900 text-white' : 'bg-brand-600 text-white'}`}>
          <div className="relative z-10">
             <h1 className="text-4xl font-extrabold mb-4">
                {activeRole === 'admin' ? (isSignup ? 'Join CulinaryAI' : 'Staff Portal') : 'Welcome Diner'}
             </h1>
             <p className="text-white/80 text-lg">
                {activeRole === 'admin' 
                  ? 'Manage your AI kitchen, update menus, and oversee orders.' 
                  : 'Experience the future of dining with AI-curated menus.'}
             </p>
          </div>

          <div className="relative z-10">
             <p className="text-sm opacity-60 uppercase tracking-widest font-bold mb-4">Select Login Type</p>
             <div className="flex gap-4">
                <button 
                  onClick={() => { setActiveRole('customer'); setIsSignup(false); setError(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeRole === 'customer' ? 'bg-white text-brand-600 shadow-lg' : 'bg-black/20 text-white hover:bg-black/30'}`}
                >
                    Customer
                </button>
                <button 
                  onClick={() => { setActiveRole('admin'); setError(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeRole === 'admin' ? 'bg-white text-slate-900 shadow-lg' : 'bg-black/20 text-white hover:bg-black/30'}`}
                >
                    Staff
                </button>
             </div>
          </div>

          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-black/10 blur-3xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white overflow-y-auto max-h-[800px]">
          <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center shadow-lg transition-colors duration-500 bg-gray-50 text-gray-900">
            {activeRole === 'admin' ? <ChefHat size={32} className="text-slate-900" /> : <Utensils size={32} className="text-brand-600" />}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {activeRole === 'admin' ? (isSignup ? 'Create Account' : 'Authenticate Access') : 'Start Your Order'}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {activeRole === 'customer' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Your Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1 flex justify-between">
                      Table Number
                      {tableParam && <span className="text-brand-600 text-xs flex items-center gap-1"><QrCode size={12}/> Auto-detected</span>}
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-3.5 ${tableParam ? 'text-brand-600' : 'text-gray-400'}`} size={20} />
                    <input 
                      type="number" 
                      placeholder="e.g. 12"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      readOnly={!!tableParam}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none ${tableParam ? 'bg-brand-50 border-brand-200 text-brand-800 font-bold focus:ring-0' : 'border-gray-200 focus:ring-2 focus:ring-brand-500'}`}
                    />
                  </div>
                </div>
              </>
            ) : (
                isSignup ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Full Name</label>
                            <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Manager Name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Restaurant Name</label>
                            <div className="relative">
                                <Building className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input type="text" value={signupRestaurant} onChange={(e) => setSignupRestaurant(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="My Bistro" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="admin@restaurant.com" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Create a password" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email or Username</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none"
                                    placeholder="admin"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                                <button type="button" className="text-xs text-slate-500 hover:text-slate-800">Forgot?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input 
                                    type="password" 
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </>
                )
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {error}
              </div>
            )}

            <button 
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                activeRole === 'admin' 
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' 
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
              }`}
            >
              {activeRole === 'admin' ? (isSignup ? 'Create Account' : 'Access Dashboard') : 'View Menu'} <ArrowRight size={20} />
            </button>
            
            {activeRole === 'admin' && (
                <div className="text-center mt-4">
                    <button 
                        type="button" 
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                    >
                        {isSignup ? "Already have an account? Login" : "Don't have an account? Signup"}
                    </button>
                </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
