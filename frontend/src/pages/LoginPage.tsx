/**
 * LoginPage.tsx — Deprecated.
 * The application now uses the Role Selection → Role Login flow.
 * This file is kept to avoid import errors if any legacy code references it.
 * App.tsx no longer renders this component.
 */
import React, { useEffect } from 'react';
import { useRouter } from '../context/RouterContext';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate('/select-role');
  }, []);

  return null;
};
