
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { registerUser, verifyLogin, createSession } from '../services/storageService';
import { User } from '../types';
import { Hexagon, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Updated to await the promise
      const user = await verifyLogin(email, password);
      if (user) {
        createSession(user);
        onLogin(user);
        toast.success(`Welcome back, ${user.name}!`);
      } else {
        toast.error('Invalid email or password.');
      }
    } else {
      if (!name || !email || !password) {
        toast.error('Please fill in all fields.');
        return;
      }
      
      // Updated to await promise
      const success = await registerUser({ name, email }, password);
      if (success) {
        const user = await verifyLogin(email, password);
        if (user) {
          createSession(user);
          onLogin(user);
          toast.success('Account created successfully!');
        }
      } else {
        toast.error('User already exists or connection error.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4 relative z-10">
            <Hexagon className="w-8 h-8 text-white fill-white/20" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">SkillFlow</h1>
          <p className="text-indigo-100 relative z-10">Track your learning journey.</p>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg">
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Removed Toggle as per Admin Only Request (But kept code logic if you revert) */}
          {/* 
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-semibold hover:underline">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};
