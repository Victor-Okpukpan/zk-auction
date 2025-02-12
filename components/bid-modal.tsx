/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
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

interface BidModalProps {
  nft: any;
  isOpen: boolean;
  onClose: () => void;
}

const durationOptions = [
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "20 minutes", value: 1200 },
  // { label: "30 minutes", value: 1800 },
  // { label: "1 hour", value: 3600 },
  // { label: "2 hours", value: 7200 },
  // { label: "5 hours", value: 18000 },
  // { label: "6 hours", value: 21600 },
  // { label: "12 hours", value: 43200 },
  // { label: "1 day", value: 86400 },
];

export function BidModal({ nft, onClose }: BidModalProps) {
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

  const CONTRACT_ADDRESS: `0x{string}` = process.env.NEXT_PUBLIC_AUCTION_MANAGER! as `0x{string}`;


  useEffect(() => {
    setNftContract(nft.contractAddress);
    setNftId(nft.tokenId);
  }, [nft]);

  const handleApproveNFT = async () => {
    setLoadingApprove(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const erc721Abi = ["function approve(address to, uint256 tokenId) external"];
      const nftInstance = new ethers.Contract(nftContract, erc721Abi, signer);
      const tx = await nftInstance.approve(CONTRACT_ADDRESS, nftId);
      await tx.wait();
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

      const result = await writeContractAsync({
        abi: auctionAbi,
        address: CONTRACT_ADDRESS,
        functionName: "createAuction",
        args: [address, numericId, bid, startTime, commitValue, revealValue],
      });

      console.log(result);
      router.push("/auctions");
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

    console.log("Auction Created:", {
      nftContract,
      nftId,
      startTime: startTimeUnix,
      commitDuration,
      revealDuration,
      minBid: minBidBigInt,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-lg p-6 w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Auction</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="commitDuration">Commit Duration</Label>
            <Select
              value={commitDuration}
              onValueChange={(value) => setCommitDuration(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
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
            <Label htmlFor="revealDuration">Reveal Duration</Label>
            <Select
              value={revealDuration}
              onValueChange={(value) => setRevealDuration(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
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
            <Label htmlFor="minBid">Minimum Bid (ETH)</Label>
            <Input
              id="minBid"
              type="number"
              step="0.000000000000000001"
              min="0"
              value={minBid}
              onChange={(e) => setMinBid(e.target.value)}
              required
              placeholder="0.1"
            />
          </div>

          {!approved && (
            <Button onClick={handleApproveNFT} disabled={loadingApprove} className="w-full">
              {loadingApprove ? "Approving NFT..." : "Approve NFT"}
            </Button>
          )}

          {approved && (
            <Button type="submit" disabled={loadingCreate} className="w-full">
              {loadingCreate ? "Creating Auction..." : "Create Auction"}
            </Button>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}
