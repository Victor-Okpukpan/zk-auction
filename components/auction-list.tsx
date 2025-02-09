/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Timer } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

interface IAuction {
  id: number;
  name: string;
  image: string;
  currentBid: string; // This is the minimum bid or current highest bid as a string.
  endTime: string;
  totalBids: number;
  minBidIncrement: string;
}

const DUMMY_AUCTIONS: IAuction[] = [
  {
    id: 1,
    name: 'Bored Ape #1234',
    image:
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=800&fit=crop',
    currentBid: '1.5',
    endTime: '2h 15m',
    totalBids: 5,
    minBidIncrement: '0.1',
  },
  {
    id: 2,
    name: 'CryptoPunk #5678',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
    currentBid: '2.8',
    endTime: '4h 30m',
    totalBids: 8,
    minBidIncrement: '0.1',
  },
];

export default function AuctionList() {
  // const snarkjs = snarkjs.window;
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProof, setLoadingProof] = useState(false);

  const generateProof = async (bidValue: string, minBid: any) => {
    const randomSalt = BigInt(Math.floor(Math.random() * 1e12)).toString();

    const input = {
      bid: bidValue.toString(),
      salt: randomSalt,
      minBid: minBid.toString(),
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      '/bid_range_commit.wasm',
      '/circuit_final.zkey'
    );
    return { proof, publicSignals, randomSalt };
  };

  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidAmount) return;
    setLoadingProof(true);
    try {
      console.log('Placing bid for auction:', selectedAuction.id, 'with bid amount:', bidAmount);
    
      const minBid = BigInt(Math.floor(parseFloat(selectedAuction.currentBid)));
      
      // Generate the zkSNARK proof for the bid.
      const { proof, publicSignals, randomSalt } = await generateProof(bidAmount, minBid);
      console.log('Generated Proof:', proof);
      console.log('Public Signals:', publicSignals);
      console.log('Random Salt used:', randomSalt);

      /// 1698583032659105351318063809703683488298731137133587784069514442381301485740
      /// 1698583032659105351318063809703683488298731137133587784069514442381301485740
      ///632963319945

      toast({
        variant: 'default',
        title: 'Bid Submitted',
        description: 'Your bid has been securely submitted with a zk proof!',
      });
      setIsOpen(false);
      setBidAmount('');
    } catch (error) {
      console.error('Error generating proof:', error);
      toast({
        variant: 'destructive',
        title: 'Bid Submission Failed',
        description: 'There was an error generating your zk proof. Please try again.',
      });
    }
    setLoadingProof(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DUMMY_AUCTIONS.map((auction, i) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group overflow-hidden rounded-xl bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl dark:bg-card/40"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <img
                src={auction.image}
                alt={auction.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="mt-4 space-y-3">
              <h3 className="text-xl font-semibold">{auction.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-primary" />
                  <span>{auction.currentBid} ETH</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>{auction.endTime}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{auction.totalBids} bids</span>
                <span>Min. increment: {auction.minBidIncrement} ETH</span>
              </div>
              <button
                onClick={() => {
                  if (!isConnected) {
                    toast({
                      variant: 'destructive',
                      title: 'Your wallet is not connected!',
                      description: 'Connect your wallet and try again.',
                    });
                    return;
                  }
                  setSelectedAuction(auction);
                  setIsOpen(true);
                }}
                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Place Bid
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold">
              Place Bid on {selectedAuction?.name}
            </Dialog.Title>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Current bid: {selectedAuction?.currentBid} ETH
              </p>
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">
                  Your bid amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={
                    Number(selectedAuction?.currentBid) +
                    Number(selectedAuction?.minBidIncrement)
                  }
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder={`Min. ${Number(selectedAuction?.currentBid) +
                    Number(selectedAuction?.minBidIncrement)}`}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handlePlaceBid}
                  disabled={
                    !bidAmount ||
                    Number(bidAmount) <= Number(selectedAuction?.currentBid) ||
                    loadingProof
                  }
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingProof ? 'Generating Proof...' : 'Confirm Bid'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border px-4 py-2 font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
