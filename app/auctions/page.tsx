"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateAuctionButton from "@/components/create-auction-button";
import AuctionList from "@/components/auction-list";
import MintNftButton from "@/components/mint-nft-button";

export default function AuctionsPage() {
  return (
    <main className="container max-w-[1200px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton showBalance={false} />
          </div>
        </div>

        <div className="w-full max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-4xl font-bold">Auctions</h1>
            <div className="flex space-x-3 items-center">
              <MintNftButton />
              <CreateAuctionButton />
            </div>
          </div>
          <AuctionList />
        </div>
      </motion.div>
    </main>
  );
}
