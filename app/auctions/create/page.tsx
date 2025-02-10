/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useNFTs } from "@/hooks/useNFTs";
import MintNftButton from "@/components/mint-nft-button";

export default function CreateAuction() {
  const { isConnected } = useAccount();
  const { nfts, loading, error } = useNFTs();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [duration, setDuration] = useState("24");
  const [startingBid, setStartingBid] = useState("");

  const handleCreateAuction = () => {
    // Implement auction creation logic here
    console.log("Creating auction:", { selectedNFT, duration, startingBid });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-[1200px]"
      >
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/auctions"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
        </div>

        <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
        <h1 className="text-3xl font-bold mb-5">
          Create Auction
        </h1>
        <MintNftButton />
        </div>
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-card p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your wallet to view your NFTs and create an auction
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8 rounded-xl bg-card p-8 max-w-2xl mx-auto">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Select NFT</h2>
              <div>
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                    {error}
                  </div>
                ) : nfts.length === 0 ? (
                  <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
                    No NFTs found in your wallet
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {nfts.map((nft) => (
                      <button
                        key={nft.id}
                        onClick={() => setSelectedNFT(nft.id)}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          selectedNFT === nft.id
                            ? "border-primary"
                            : "border-transparent hover:border-muted"
                        }`}
                      >
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="aspect-square w-full object-cover"
                        />
                        <div className="absolute bottom-0 w-full bg-black/50 p-2">
                          <p className="text-sm text-white">{nft.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">
                  Duration (hours)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Starting Bid (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder="0.1"
                />
              </div>
            </div>

            <button
              onClick={handleCreateAuction}
              disabled={!selectedNFT || !startingBid}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Auction
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
