/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { useNFTs } from "@/hooks/useNFTs"
import MintNftButton from "@/components/mint-nft-button"
import { Card, CardContent } from "@/components/ui/card"
import { NFTGrid } from "@/components/nft-grid"
import { BidModal } from "@/components/bid-modal"

export default function CreateAuction() {
  const { isConnected } = useAccount()
  const { nfts, loading, error } = useNFTs()
  console.log(nfts);
  const [selectedNFT, setSelectedNFT] = useState<any | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)

  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft)
    setIsBidModalOpen(true)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/auctions" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            Back to Auctions
          </Link>
          <ConnectButton showBalance={false} />
        </div>

        <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Create Auction</h1>
        <MintNftButton />
        </div>

        {!isConnected ? (
          <Card className="p-8 text-center">
            <CardContent className="flex flex-col items-center gap-4">
              <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect your wallet to view your NFTs and create an auction</p>
              <ConnectButton />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Your NFTs</h2>
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
                ) : nfts.length === 0 ? (
                  <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
                    No NFTs found in your wallet
                  </div>
                ) : (
                  <NFTGrid nfts={nfts} onNFTClick={handleNFTClick} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isBidModalOpen && (
          <BidModal nft={selectedNFT} isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} />
        )}
      </AnimatePresence>
    </main>
  )
}

