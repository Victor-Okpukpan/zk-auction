/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Timer } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { auctionAbi } from "@/lib/AuctionAbi";
// import { verifyProof } from "@/hooks/useZkVerify";
import vk from "../circuits/key_verification.json";

// -----------------------------------------------------------------------------
// Updated Interfaces to Match the Smart Contract
// -----------------------------------------------------------------------------

// Represents a bid commitment as defined in the smart contract.
interface IBidCommit {
  bidder: string;
  deposit: string; // Deposited funds (as a string for simplicity)
  bidCommitment: string; // The commitment hash (as a string)
  revealed: boolean;
  bidValue: string; // Revealed bid value (as a string)
  refunded: boolean;
}

// Updated Auction interface matching the contract's Auction struct.
interface IAuction {
  id: number; // Added an id field for front-end use
  seller: string;
  nftAddress: string;
  tokenId: string;
  minBid: string; // Minimum bid (in wei or ETH as string)
  startTime: number; // Unix timestamp for when commit phase starts
  commitEndTime: number; // Unix timestamp for end of commit phase
  revealEndTime: number; // Unix timestamp for end of reveal phase
  closed: boolean;
  highestBidder: string;
  bids: IBidCommit[];
}

// -----------------------------------------------------------------------------
// Dummy Auctions (for testing/demo) updated to match IAuction
// -----------------------------------------------------------------------------
const DUMMY_AUCTIONS: IAuction[] = [
  {
    id: 1,
    seller: "0xSeller1",
    nftAddress: "0xNFTAddress1",
    tokenId: "1",
    minBid: "1.5", // In ETH
    startTime: Math.floor(Date.now() / 1000) - 500, // Started 500 seconds ago
    commitEndTime: Math.floor(Date.now() / 1000) + 3600, // Commit phase ends in 1 hour
    revealEndTime: Math.floor(Date.now() / 1000) + 7200, // Reveal phase ends in 2 hours
    closed: false,
    highestBidder: "0x0000000000000000000000000000000000000000",
    bids: [],
  },
  {
    id: 2,
    seller: "0xSeller2",
    nftAddress: "0xNFTAddress2",
    tokenId: "2",
    minBid: "2.8", // In ETH
    startTime: Math.floor(Date.now() / 1000) - 1000, // Started 1000 seconds ago
    commitEndTime: Math.floor(Date.now() / 1000) - 100, // Commit phase ended 100 seconds ago
    revealEndTime: Math.floor(Date.now() / 1000) + 1800, // Reveal phase ends in 30 minutes
    closed: false,
    highestBidder: "0x0000000000000000000000000000000000000000",
    bids: [],
  },
];

// -----------------------------------------------------------------------------
// Helper Function: Format seconds into a countdown string (HHh MMm SSs)
// -----------------------------------------------------------------------------
const formatCountdown = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// -----------------------------------------------------------------------------
// AuctionList Component with Countdown and Reveal Phase Button
// -----------------------------------------------------------------------------
export default function AuctionList() {
  const { writeContractAsync } = useWriteContract();
  // const { onVerifyProof, status, transactionResult, error } = useZkVerify();
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProof, setLoadingProof] = useState(false);
  const [auctions, setAuctions] = useState<IAuction[]>([]);

  // Current time (in seconds) for countdown calculations.
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const CONTRACT_ADDRESS = "0xcB26E956ba06d77dea887d74592223148dC9D08c";

  // Update the current time every second.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // zkSNARK Proof Generation (dummy implementation for demonstration)
  // ---------------------------------------------------------------------------
  const generateProof = async (bidValue: string, minBid: any) => {
    const randomSalt = BigInt(Math.floor(Math.random() * 1e12)).toString();
    const input = {
      bid: bidValue.toString(),
      salt: randomSalt,
      minBid: minBid.toString(),
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "/bid_range_commit.wasm",
      "/circuit_final.zkey"
    );
    return { proof, publicSignals, randomSalt };
  };

  // ---------------------------------------------------------------------------
  // Place Bid Handler
  // ---------------------------------------------------------------------------
  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidAmount) return;
    setLoadingProof(true);
    try {
      console.log(
        "Placing bid for auction:",
        selectedAuction.id,
        "with bid amount:",
        bidAmount
      );

      const minBid = BigInt(Math.floor(parseFloat(selectedAuction.minBid)));
      // Generate the zkSNARK proof for the bid.
      const { proof, publicSignals, randomSalt } = await generateProof(
        bidAmount,
        minBid
      );
      console.log("Generated Proof:", proof);
      console.log("Public Signals:", publicSignals);
      console.log("Random Salt used:", randomSalt);

      // Make API request to verify the proof
      const response = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, publicSignals, vk }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Proof verification failed");
      }

      console.log(data);

      // Using the auction id from selectedAuction
      // const result = await writeContractAsync({
      //   abi: auctionAbi,
      //   address: CONTRACT_ADDRESS,
      //   functionName: "commitBid",
      //   args: [selectedAuction.id, publicSignals],
      // });

      toast({
        variant: "default",
        title: "Bid Submitted",
        description: "Your bid has been securely submitted with a zk proof!",
      });
      setIsOpen(false);
      setBidAmount("");
    } catch (error) {
      console.error("Error generating proof:", error);
      toast({
        variant: "destructive",
        title: "Bid Submission Failed",
        description:
          "There was an error generating your zk proof. Please try again.",
      });
    }
    setLoadingProof(false);
  };

  const handleRevealBids = async (id: number) => {
    try {
      const result = await writeContractAsync({
        abi: auctionAbi,
        address: CONTRACT_ADDRESS,
        functionName: "commitBid",
        // args: [id, bidValue, salt],
      });
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------------------------------------------------------------------
  // Fetch Active Auctions from the Contract (or use dummy data)
  // ---------------------------------------------------------------------------
  const { data } = useReadContract({
    abi: auctionAbi,
    address: CONTRACT_ADDRESS,
    functionName: "getActiveAuctions",
  });

  useEffect(() => {
    if (data) {
      setAuctions(data as IAuction[]);
    } else {
      // Fallback to dummy data if no real data is available.
      setAuctions(DUMMY_AUCTIONS);
    }
  }, [data]);

  // ---------------------------------------------------------------------------
  // Determine the current auction phase and remaining time
  // ---------------------------------------------------------------------------
  const getAuctionPhase = (auction: IAuction) => {
    if (currentTime < auction.startTime) {
      return {
        phase: "Not Started",
        countdown: auction.startTime - currentTime,
      };
    } else if (
      currentTime >= auction.startTime &&
      currentTime < auction.commitEndTime
    ) {
      return {
        phase: "Commit Phase",
        countdown: auction.commitEndTime - currentTime,
      };
    } else if (
      currentTime >= auction.commitEndTime &&
      currentTime < auction.revealEndTime
    ) {
      return {
        phase: "Reveal Phase",
        countdown: auction.revealEndTime - currentTime,
      };
    } else {
      return {
        phase: "Finalization Phase",
        countdown: 0,
      };
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction, i) => {
          const { phase, countdown } = getAuctionPhase(auction);
          return (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group overflow-hidden rounded-xl bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl dark:bg-card/40"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                {/* Replace with your NFT image logic */}
                <img
                  src="https://via.placeholder.com/300"
                  alt={`Auction ${auction.id}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="text-xl font-semibold">Auction #{auction.id}</h3>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-primary" />
                    <span>{auction.minBid} ETH</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>{formatCountdown(countdown)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current Phase: <strong>{phase}</strong>
                </p>
                {/* Conditionally show the Reveal button during the Reveal Phase */}
                {phase === "Reveal Phase" ? (
                  <button
                    onClick={() => {
                      handleRevealBids(auction.id);
                      toast({
                        variant: "default",
                        title: "Reveal Phase Active",
                        description: "It's time to reveal your bid!",
                      });
                    }}
                    className="w-full rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                  >
                    Reveal Your Bid
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!isConnected) {
                        toast({
                          variant: "destructive",
                          title: "Your wallet is not connected!",
                          description: "Connect your wallet and try again.",
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
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* -----------------------------------------------------------------------
           Bid Dialog
      ----------------------------------------------------------------------- */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold">
              Place Bid on Auction #{selectedAuction?.id}
            </Dialog.Title>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Minimum bid: {selectedAuction?.minBid} ETH
              </p>
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">
                  Your bid amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={Number(selectedAuction?.minBid) || 0}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder={`Min. ${selectedAuction?.minBid}`}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handlePlaceBid}
                  disabled={!bidAmount || loadingProof}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingProof ? "Generating Proof..." : "Confirm Bid"}
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
