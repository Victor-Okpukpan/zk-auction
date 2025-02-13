/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Clock, DollarSign, CheckCircle } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWriteContract } from "wagmi";
import { auctionAbi } from "@/lib/AuctionAbi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type React from "react"; // Added import for React

interface BidModalProps {
  nft: any;
  isOpen: boolean;
  onClose: () => void;
}

const durationOptions = [
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "20 minutes", value: 1200 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
];

export function BidModal({ nft, isOpen, onClose }: BidModalProps) {
  const router = useRouter();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const [startTime, setStartTime] = useState("");
  const [revealDuration, setRevealDuration] = useState("");
  const [commitDuration, setCommitDuration] = useState("");
  const [nftContract, setNftContract] = useState("");
  const [nftId, setNftId] = useState("");
  const [minBid, setMinBid] = useState("");
  const [approved, setApproved] = useState(false);

  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [progress, setProgress] = useState(0);

  const CONTRACT_ADDRESS: `0x{string}` = process.env
    .NEXT_PUBLIC_AUCTION_MANAGER! as `0x{string}`;

  useEffect(() => {
    setNftContract(nft.contractAddress);
    setNftId(nft.tokenId);
  }, [nft]);

  const handleApproveNFT = async () => {
    setLoadingApprove(true);
    setProgress(0);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const erc721Abi = [
        "function approve(address to, uint256 tokenId) external",
      ];
      const nftInstance = new ethers.Contract(nftContract, erc721Abi, signer);
      const tx = await nftInstance.approve(CONTRACT_ADDRESS, nftId);
      setProgress(50);
      await tx.wait();
      setProgress(100);
      setApproved(true);
      toast({
        title: "NFT Approved",
        description: "Your NFT has been approved successfully.",
      });
    } catch (error) {
      console.error("Error approving NFT:", error);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: "There was an error approving your NFT.",
      });
    } finally {
      setLoadingApprove(false);
    }
  };

  const createAuction = async (
    address: string,
    id: string,
    bid: bigint,
    startTime: number,
    commit: string,
    reveal: string
  ) => {
    try {
      const numericId = Number(id);
      const commitValue = Number(commit);
      const revealValue = Number(reveal);

      if (isNaN(numericId) || isNaN(commitValue) || isNaN(revealValue)) {
        throw new Error("Invalid ID: Not a number");
      }

      setProgress(25);
      const result = await writeContractAsync({
        abi: auctionAbi,
        address: CONTRACT_ADDRESS,
        functionName: "createAuction",
        args: [address, numericId, bid, startTime, commitValue, revealValue],
      });

      setProgress(75);
      router.push("/auctions");
      setProgress(100);
      toast({
        title: "Auction Created",
        description: "Your auction has been created successfully.",
      });
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Auction Creation Failed",
        description: "There was an error creating your auction.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!approved) {
      console.error("Please approve the NFT before creating the auction.");
      toast({
        variant: "destructive",
        title: "Approval Required",
        description: "Please approve the NFT before creating the auction.",
      });
      return;
    }

    const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);
    const minBidWei = ethers.utils.parseEther(minBid);
    const minBidBigInt = BigInt(minBidWei.toString());
    setLoadingCreate(true);
    setProgress(0);
    try {
      await createAuction(
        nftContract,
        nftId,
        minBidBigInt,
        startTimeUnix,
        commitDuration,
        revealDuration
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingCreate(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 w-full max-w-md overflow-hidden shadow-2xl border border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Auction</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative w-24 h-24">
                <Image
                  src={nft.image}
                  alt={nft.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
              <div className="flex-grow pr-5">
                <h3 className="text-lg font-semibold truncate max-w-52">
                  {nft.name}
                </h3>
                <p className="text-sm text-muted-foreground text-wrap truncate max-w-52">
                  #{nft.tokenId}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="startTime" className="text-gray-300">
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commitDuration" className="text-gray-300">
                    Commit Duration
                  </Label>
                  <Select
                    value={commitDuration}
                    onValueChange={(value) => setCommitDuration(value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="revealDuration" className="text-gray-300">
                    Reveal Duration
                  </Label>
                  <Select
                    value={revealDuration}
                    onValueChange={(value) => setRevealDuration(value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="minBid" className="text-gray-300">
                  Minimum Bid (ETH)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    id="minBid"
                    type="number"
                    step="0.000000000000000001"
                    min="0"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    required
                    placeholder="0.1"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {!approved ? (
                <Button
                  onClick={handleApproveNFT}
                  disabled={loadingApprove}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loadingApprove ? (
                    <>
                      <span className="mx-auto">Approving NFT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve NFT
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loadingCreate}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {loadingCreate ? (
                    <>
                      <span className="mx-auto">Creating Auction...</span>
                    </>
                  ) : (
                    "Create Auction"
                  )}
                </Button>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
