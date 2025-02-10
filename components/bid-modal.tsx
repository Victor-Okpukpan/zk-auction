/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
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
  const [startTime, setStartTime] = useState("");
  const [revealDuration, setRevealDuration] = useState("");
  const [commitDuration, setCommitDuration] = useState("");
  const [nftContract, setNftContract] = useState("");
  const [nftId, setNftId] = useState("");

  useEffect(() => {
    setNftContract(nft.contractAddress);
    setNftId(nft.tokenId);
  }, [nft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement bid submission logic here
    console.log("Bid submitted:", {
      nftContract,
      nftId,
      startTime,
      commitDuration,
      revealDuration,
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
            <h3 className="text-lg font-semibold truncate max-w-52">{nft.name}</h3>
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
          <Button type="submit" className="w-full">
            Place Bid
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
