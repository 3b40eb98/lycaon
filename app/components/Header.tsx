import React from 'react';
import { WalletButton } from './WalletButton';

// interface HeaderProps {
// }

export const Header = () => (
  <div className="flex border-b-2 border-red-100 items-center w-full px-7 py-4 justify-between">
    Logo
    <WalletButton />
  </div>
);
