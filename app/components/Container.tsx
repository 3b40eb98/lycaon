import React from 'react';
import { Header } from './Header';

interface ContainerProps {
  children: React.ReactNode;
}

export const Container = ({ children }: ContainerProps) => (
  <div className="min-h-screen h-screen">
    <Header />
    <div className="max-w-[1366px] w-full my-0 mx-auto py-0">{children}</div>
  </div>
);
