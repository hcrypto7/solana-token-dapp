"use client";
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Header = () => {
  return (
    <div className="h-[10vh] bg-black flex justify-center">
      <div className="max-w-[900px] flex justify-between items-center w-full">
        <div className="text-white font-bold text-[30px]">
          Solana Token Dapp
        </div>
        <div>
          <WalletMultiButton/>
        </div>
      </div>
    </div>
  );
};

export default Header;
