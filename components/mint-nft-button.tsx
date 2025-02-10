"use client";
import { useNFTs } from "@/hooks/useNFTs";
import { nftAbi } from "@/lib/NftAbi";
import { useWriteContract } from "wagmi";

export default function MintNftButton() {
  const { writeContractAsync } = useWriteContract();
  const { refetch } = useNFTs(); 

  const mintNft = async () => {
    try {
      const result = await writeContractAsync({
        abi: nftAbi,
        address: "0xcB26E956ba06d77dea887d74592223148dC9D08c",
        functionName: "mintNft",
      });

      console.log(result);
      refetch();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <button
      onClick={mintNft}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Mint NFT
    </button>
  );
}
