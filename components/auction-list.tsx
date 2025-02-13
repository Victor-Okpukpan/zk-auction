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
import vk from "../circuits/veekey.json";
import { ethers } from "ethers";
import { zkAbi } from "@/lib/zkAbi";

// -------------------------------
// Interfaces
// -------------------------------
interface IBidCommit {
  bidder: string;
  deposit: string;
  bidCommitment: string;
  revealed: boolean;
  bidValue: string;
  refunded: boolean;
}

interface IAuction {
  id: number;
  seller: string;
  nftAddress: string;
  tokenId: string;
  minBid: string;
  startTime: number;
  commitEndTime: number;
  revealEndTime: number;
  closed: boolean;
  highestBidder: string;
  bids: IBidCommit[];
}

// -------------------------------
// Utility Functions
// -------------------------------
const formatCountdown = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// -------------------------------
// AuctionCard Component
// -------------------------------
interface AuctionCardProps {
  auction: IAuction;
}

function AuctionCard({ auction }: AuctionCardProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchNFTMetadata = async () => {
      if (!auction.nftAddress || !auction.tokenId) return;
      try {
        // Create a provider using your public RPC URL
        const provider = new ethers.providers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_ARB_RPC_URL
        );
        const nftContract = new ethers.Contract(
          auction.nftAddress,
          ["function tokenURI(uint256 tokenId) view returns (string)"],
          provider
        );
        const tokenURI = await nftContract.tokenURI(auction.tokenId);
        // Convert ipfs:// URIs to a gateway URL if needed
        const metadataURI = tokenURI.startsWith("ipfs://")
          ? tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : tokenURI;
        const response = await fetch(metadataURI);
        const metadata = await response.json();
        let img = metadata.image;
        if (img && img.startsWith("ipfs://")) {
          img = img.replace("ipfs://", "https://ipfs.io/ipfs/");
        }
        setImageUrl(img);
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
      }
    };

    fetchNFTMetadata();
  }, [auction.nftAddress, auction.tokenId]);

  return (
    <img
      src={imageUrl}
      alt={`Auction ${auction.id}`}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
    />
  );
}

// -------------------------------
// AuctionList Component
// -------------------------------
export default function AuctionList() {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofVerified, setProofVerified] = useState(false);
  const [bidCommitment, setBidCommitment] = useState<string | null>(null);
  const [generatedSalt, setGeneratedSalt] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<IAuction[]>([]);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const CONTRACT_ADDRESS = process.env
    .NEXT_PUBLIC_AUCTION_MANAGER! as `0x{string}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------
  // Proof Generation
  // -------------------------------
  const generateProof = async (bidValue: string, minBid: any) => {
    const randomSalt = BigInt(Math.floor(Math.random() * 1e12)).toString();
    const input = {
      bid: bidValue,
      salt: randomSalt,
      minBid: minBid,
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "/bid_range_commit.wasm",
      "/circuit_final.zkey"
    );
    return { proof, publicSignals, randomSalt };
  };

  // -------------------------------
  // Stage 1: Verify Proof
  // -------------------------------
  const handleVerifyProof = async () => {
    if (!selectedAuction || !bidAmount) return;
    setLoadingProof(true);
    try {
      console.log(
        "Verifying proof for auction:",
        selectedAuction.id,
        "with bid amount:",
        bidAmount
      );
      const bidValueWeiStr = ethers.utils.parseEther(bidAmount).toString();
      const minBidWeiStr = selectedAuction.minBid;

      // Generate the zk proof
      const { proof, publicSignals, randomSalt } = await generateProof(
        bidValueWeiStr,
        minBidWeiStr
      );

      // Call your API to verify the proof off-chain
      const response = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, publicSignals, vk }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Proof verification failed");
      }
      console.log("API verification data:", data);

      // Destructure data returned from API
      const { attestationId, merklePath, leaf, leafCount, index } = data;
      const formattedMerklePath = merklePath.map((val: ethers.utils.BytesLike) =>
        ethers.utils.hexZeroPad(val, 32)
      );

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const zkVerifyAddress = process.env.NEXT_PUBLIC_ZKVERIFY_ADDRESS;
      if (!zkVerifyAddress) throw new Error("zkVerify contract address not set");

      const zkContract = new ethers.Contract(zkVerifyAddress, zkAbi, signer);
      const verified = await zkContract.verifyProofAttestation(
        attestationId,
        leaf,
        formattedMerklePath,
        leafCount,
        index
      );

      if (!verified) {
        throw new Error("On-chain proof verification failed");
      }

      // For this example we assume the bidCommitment is publicSignals[0]
      setBidCommitment(publicSignals[0]);
      setGeneratedSalt(randomSalt);
      setProofVerified(true);

      toast({
        variant: "default",
        title: "Proof Verified",
        description:
          "Your zk proof has been successfully verified on-chain. Please proceed to place your bid.",
      });
    } catch (error) {
      console.error("Error during proof verification:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description:
          "There was an error verifying your proof. Please try again.",
      });
    }
    setLoadingProof(false);
  };

  // -------------------------------
  // Stage 2: Commit Bid
  // -------------------------------
  const handleCommitBid = async () => {
    if (!selectedAuction || !bidCommitment || !bidAmount) return;
    try {
      const bidValueBN = ethers.utils.parseEther(bidAmount);
      const result = await writeContractAsync({
        abi: auctionAbi,
        address: CONTRACT_ADDRESS,
        functionName: "commitBid",
        args: [selectedAuction.id, bidCommitment],
        value: bidValueBN.toBigInt(),
      });
      console.log("Bid committed:", result);
      localStorage.setItem(
        `bidData-${selectedAuction.id}`,
        JSON.stringify({ bidValue: bidValueBN.toString(), randomSalt: generatedSalt })
      );
      toast({
        variant: "default",
        title: "Bid Submitted",
        description: "Your bid has been placed.",
      });
      // Reset modal and state
      setIsOpen(false);
      setBidAmount("");
      setProofVerified(false);
      setBidCommitment(null);
    } catch (error) {
      console.error("Error during bid commitment:", error);
      toast({
        variant: "destructive",
        title: "Bid Submission Failed",
        description:
          "There was an error placing your bid. Please try again.",
      });
    }
  };

  const { data: activeAuctionsOnChain, refetch: refetchAuctions } =
    useReadContract({
      abi: auctionAbi,
      address: CONTRACT_ADDRESS,
      functionName: "getActiveAuctions",
    });

  const handleRevealBids = async (id: number) => {
    try {
      const storedBidData = localStorage.getItem(`bidData-${id}`);
      if (storedBidData) {
        const { bidValue, randomSalt } = JSON.parse(storedBidData);
        const result = await writeContractAsync({
          abi: auctionAbi,
          address: CONTRACT_ADDRESS,
          functionName: "revealBid",
          args: [id, bidValue, randomSalt],
        });
        refetchAuctions();
        toast({
          variant: "default",
          title: "Bids Revealed",
          description: "Your bid for this auction has been revealed successfully!",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Bid Reveal Failed",
        description: "Your bid for this auction has failed, please reach out to Auction Owner.",
      });
    }
  };

  useEffect(() => {
    if (activeAuctionsOnChain) {
      setAuctions(activeAuctionsOnChain as IAuction[]);
    }
  }, [activeAuctionsOnChain]);

  useEffect(() => {
    if (auctions.length === 0) return;

    const activeRevealAuctions = auctions.filter((auction) => {
      const revealEnd =
        typeof auction.revealEndTime === "bigint"
          ? Number(auction.revealEndTime)
          : auction.revealEndTime;
      return currentTime < revealEnd;
    });

    if (activeRevealAuctions.length === 0) return;

    const nextRevealEnd = Math.min(
      ...activeRevealAuctions.map((auction) =>
        typeof auction.revealEndTime === "bigint"
          ? Number(auction.revealEndTime)
          : auction.revealEndTime
      )
    );

    const delaySeconds = nextRevealEnd - currentTime;

    if (delaySeconds > 0) {
      const timeout = setTimeout(() => {
        refetchAuctions();
      }, delaySeconds * 1000);
      return () => clearTimeout(timeout);
    }
  }, [auctions, currentTime, refetchAuctions]);

  const getAuctionPhase = (auction: IAuction) => {
    const startTimeNum =
      typeof auction.startTime === "bigint"
        ? Number(auction.startTime)
        : auction.startTime;
    const commitEndTimeNum =
      typeof auction.commitEndTime === "bigint"
        ? Number(auction.commitEndTime)
        : auction.commitEndTime;
    const revealEndTimeNum =
      typeof auction.revealEndTime === "bigint"
        ? Number(auction.revealEndTime)
        : auction.revealEndTime;

    if (currentTime < startTimeNum) {
      return { phase: "Not Started", countdown: startTimeNum - currentTime };
    } else if (currentTime >= startTimeNum && currentTime < commitEndTimeNum) {
      return {
        phase: "Commit Phase",
        countdown: commitEndTimeNum - currentTime,
      };
    } else if (
      currentTime >= commitEndTimeNum &&
      currentTime < revealEndTimeNum
    ) {
      return {
        phase: "Reveal Phase",
        countdown: revealEndTimeNum - currentTime,
      };
    } else {
      return { phase: "Finalization Phase", countdown: 0 };
    }
  };

  return (
    <>
      {auctions.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-lg font-semibold">No Active Auctions</p>
        </div>
      ) : (
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
                  <AuctionCard auction={auction} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="mt-4 space-y-3">
                  <h3 className="text-xl font-semibold">
                    Auction #{auction.id}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      <span>
                        {ethers.utils.formatEther(auction.minBid)} ETH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{formatCountdown(countdown)}</span>
                    </div>
                  </div>
                  {phase === "Finalization Phase" ? (
                    <p className="text-[10px] text-muted-foreground">
                      Highest Bidder:{" "}
                      <strong>
                        {auction.highestBidder !==
                        "0x0000000000000000000000000000000000000000"
                          ? auction.highestBidder
                          : "No bids"}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      Current Phase: <strong>{phase}</strong>
                    </p>
                  )}
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
                        if (
                          phase === "Not Started" ||
                          phase === "Finalization Phase"
                        )
                          return;
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
                        // Reset any previous proof state when opening modal
                        setProofVerified(false);
                        setBidCommitment(null);
                      }}
                      disabled={
                        phase === "Not Started" ||
                        phase === "Finalization Phase"
                      }
                      className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                        phase === "Not Started" ||
                        phase === "Finalization Phase"
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {phase === "Not Started"
                        ? "Not Started"
                        : phase === "Finalization Phase"
                        ? "Bid Ended"
                        : "Place Bid"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setProofVerified(false);
          setBidCommitment(null);
        }}
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
                Minimum bid:{" "}
                {selectedAuction
                  ? `${ethers.utils.formatEther(selectedAuction.minBid)} ETH`
                  : ""}
              </p>
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">
                  Your bid amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={Number(
                    selectedAuction
                      ? ethers.utils.formatEther(selectedAuction.minBid)
                      : 0
                  )}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder={
                    selectedAuction
                      ? `Min. ${ethers.utils.formatEther(
                          selectedAuction.minBid
                        )}`
                      : ""
                  }
                />
              </div>
              <div className="mt-6 flex gap-3">
                {!proofVerified ? (
                  <button
                    onClick={handleVerifyProof}
                    disabled={
                      !bidAmount ||
                      loadingProof ||
                      (selectedAuction &&
                        parseFloat(bidAmount) <
                          parseFloat(
                            ethers.utils.formatEther(selectedAuction.minBid)
                          ))
                    }
                    className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingProof ? "Verifying Proof..." : "Verify Proof"}
                  </button>
                ) : (
                  <button
                    onClick={handleCommitBid}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Confirm Bid
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setProofVerified(false);
                    setBidCommitment(null);
                  }}
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
