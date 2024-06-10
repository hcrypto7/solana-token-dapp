"use client";

import React from "react";
import { Select, SelectItem, Button } from "@nextui-org/react";
import { tokens, gold } from "./data";
import { useState, useEffect } from "react";
import * as web3 from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createBurnInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createInitializeAccountInstruction,
} from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { showToast } from "@/helper/ToastNotify";

const TokenBurn = () => {
  const [burnToken, setBurnToken] = useState<string>("sword");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tx, setTx] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const tokenBurnAndMint = async () => {
    if (publicKey === undefined || publicKey === null) {
      showToast("info", "Please connect Wallet");
      return;
    }
    setIsProcessing(true);
    const selectedToken = tokens.find((token) => token.key === burnToken);
    console.log(selectedToken, gold);
    console.log(publicKey, connection);

    const tokenMint = new web3.PublicKey(selectedToken?.tokenMint);
    let mintInfo = await connection.getParsedAccountInfo(tokenMint);

    // all the token data is here
    console.log(mintInfo.value.data.parsed.info.decimals);
    const tokenDecimals = mintInfo.value.data.parsed.info.decimals;

    const goldMint = new web3.PublicKey(gold.tokenMint);
    console.log("gold mint:", goldMint);
    let goldInfo = await connection.getParsedAccountInfo(goldMint); // or await getMint(goldMint)

    console.log("gold decimal: ", goldInfo.value?.data.parsed.info.decimals);

    const goldAuthority = new web3.PublicKey(
      goldInfo.value?.data.parsed.info.mintAuthority
    );
    const goldDecimals = goldInfo.value.data.parsed.info.decimals;
    console.log("authority:", goldAuthority, goldDecimals);
    const goldAmount = new BN(selectedToken?.goldRate * 10 ** goldDecimals);
    console.log(goldAmount);
    const goldProgramID = new web3.PublicKey(gold.programID);

    const amount = new BN(1 * 10 ** tokenDecimals);
    console.log(amount);

    const programID = new web3.PublicKey(selectedToken?.programID);

    const transaction = new web3.Transaction();
    const tokenAta = await getAssociatedTokenAddressSync(
      tokenMint,
      publicKey,
      true,
      programID
    );

    console.log("tokenATA:", tokenAta);

    const tokenAtaInfo = await connection.getAccountInfo(tokenAta);
    if (tokenAtaInfo) {
      console.log(
        "Associated token account already exists:",
        tokenAta.toString()
      );
    } else {
      console.log("token alive");
      showToast("error", "No enough token")
      setIsProcessing(false);
      return;
    }

    const goldAta = await getAssociatedTokenAddressSync(
      goldMint,
      publicKey,
      true,
      goldProgramID
    );

    const goldAtaInfo = await connection.getAccountInfo(goldAta);
    if (goldAtaInfo) {
      console.log(
        "Associated token account already exists:",
        goldAta.toString()
      );
    } else {
      console.log("token alive");
      const goldAtaInstruction = createAssociatedTokenAccountInstruction(
        publicKey,
        goldAta,
        publicKey,
        goldMint,
        goldProgramID
      );
      transaction.add(goldAtaInstruction);
    }


    const burnInstruction = createBurnInstruction(
      tokenAta,
      tokenMint,
      publicKey,
      amount,
      undefined,
      programID
    );
    const mintInstruction = createMintToInstruction(
      goldMint,
      goldAta,
      goldAuthority,
      goldAmount,
      undefined,
      goldProgramID
    );
    console.log(burnInstruction);
    transaction.add(burnInstruction).add(mintInstruction);

    sendTransaction(transaction, connection)
      .then((sig) => {
        console.log(sig);
        showToast("success", "Token burned and received Gold!!!");
        setTx(`https://explorer.solana.com/tx/${sig}?cluster=devnet`);
        setIsProcessing(false);
      })
      .catch((err) => {
        console.log(err.message);
        setIsProcessing(false);
      });
  };

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="flex flex-row w-full justify-center items-center gap-4">
          <Select
            isRequired
            size="sm"
            label="Token List"
            placeholder="Select an token to Burn"
            defaultSelectedKeys={["sword"]}
            className="max-w-xs"
            onChange={(event) => setBurnToken(event.target.value)}
          >
            {tokens.map((token) => (
              <SelectItem
                key={token.key}
              >{`${token.label} => ${token.goldRate} Gold`}</SelectItem>
            ))}
          </Select>
          <Button
            color="primary"
            variant="ghost"
            onClick={tokenBurnAndMint}
            isDisabled={isProcessing}
            isLoading={isProcessing}
          >
            Burn and Mint Gold
          </Button>
        </div>
        <div className="mt-12 w-full text-center">
          <a target="_blank" href={tx}>
            Check Transaction Hash
          </a>
        </div>
      </div>
    </>
  );
};

export default TokenBurn;
