"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Signup = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    setIsSignupLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        showError(error.message || 'Sign up failed. Please try again.');
      } else if (data.user) {
        showSuccess('Sign up successful! Please check your email to confirm your account.');
        navigate('/login');
      } else {
        showError('Sign up failed. Please try again.');
      }
    } catch (error) {
      showError('An error occurred during sign up. Please try again.');
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSignupLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        showError('Google sign up failed. Please try again.');
      }
    } catch (error) {
      showError('An error occurred during Google sign up. Please try again.');
    } finally {
      setIsSignupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full border-b-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img src="/Icon.png" alt="NanoEdit Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join NanoEdit
          </h1>
          <p className="text-muted-foreground">
            Create your free account and start editing
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign Up
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 py-3 rounded-lg font-medium"
                disabled={isSignupLoading}
              >
                {isSignupLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-t-transparent border-r-transparent border-b-transparent border-l-transparent rounded-full border-b-transparent animate-spin"></div>
                    <span className="ml-2">Signing up...</span>
                  </div>
                ) : 'Create Account'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login Options */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center bg-white border border-border hover:bg-accent transition-all duration-200 py-3 rounded-lg font-medium text-foreground"
                disabled={isSignupLoading}
              >
                <Chrome className="w-5 h-5 mr-3" />
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;