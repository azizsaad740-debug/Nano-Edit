"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/session-provider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, User as UserIcon } from 'lucide-react';

const Login = () => {
  const { user, isLoading, setIsGuest } = useSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGuestLogin = () => {
    setIsGuest(true);
    navigate('/', { replace: true });
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            Welcome to NanoEdit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Auth
            supabaseClient={supabase}
            providers={['google']}
            redirectTo={window.location.origin + '/'}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light"
            socialLayout="horizontal"
          />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <Button 
            onClick={handleGuestLogin} 
            className="w-full" 
            variant="outline"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;