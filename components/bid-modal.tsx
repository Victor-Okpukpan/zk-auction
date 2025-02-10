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
  { label: "2 hours", value: 7200 },
  { label: "5 hours", value: 18000 },
  { label: "6 hours", value: 21600 },
  { label: "12 hours", value: 43200 },
  { label: "1 day", value: 86400 },
];

export function BidModal({ nft, onClose }: BidModalProps) {
  const { writeContractAsync } = useWriteContract();
  const [startTime, setStartTime] = useState("");
  const [revealDuration, setRevealDuration] = useState("");
  const [commitDuration, setCommitDuration] = useState("");
  const [nftContract, setNftContract] = useState("");
  const [nftId, setNftId] = useState("");
  const [minBid, setMinBid] = useState("");

  const CONTRACT_ADDRESS = "0xcB26E956ba06d77dea887d74592223148dC9D08c";

  useEffect(() => {
    setNftContract(nft.contractAddress);
    setNftId(nft.tokenId);
  }, [nft]);

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
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);
    const minBidWei = ethers.utils.parseEther(minBid);
    const minBidBigInt = BigInt(minBidWei.toString());
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
    }

    console.log("Bid submitted:", {
      nftContract,
      nftId,
      startTime: startTimeUnix,
      commitDuration,
      revealDuration,
      minBid: minBidBigInt,
    });
    onClose();
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
          <h2 className="text-2xl font-bold">Place Bid</h2>
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

          <Button type="submit" className="w-full">
            Place Bid
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
