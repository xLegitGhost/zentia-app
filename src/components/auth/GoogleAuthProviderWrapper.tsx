import React from 'react';
import { Platform } from 'react-native';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '1083921093847-placeholder.apps.googleusercontent.com';

export const GoogleAuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (Platform.OS === 'web') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    );
  }
  return <>{children}</>;
};

export default GoogleAuthProviderWrapper;
