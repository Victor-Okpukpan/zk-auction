"use client";
import { useState } from "react";
import { nftAbi } from "@/lib/NftAbi";
import { useWriteContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export default function MintNftButton() {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const mintNft = async () => {
    setLoading(true);
    try {
      const result = await writeContractAsync({
        abi: nftAbi,
        address: process.env.NEXT_PUBLIC_SAD_FACE! as `0x{string}`,
        functionName: "mintNft",
      });
      console.log(result);
      
      toast({
        title: "NFT Minted",
        description: "Your NFT has been minted successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: "There was an error minting your NFT. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={mintNft}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Minting NFT..." : "Mint NFT"}
    </button>
  );
}
