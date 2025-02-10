'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Alchemy, Network } from 'alchemy-sdk';

const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.ARB_SEPOLIA,
};

const alchemy = new Alchemy(config);

interface INFT {
    id: number;
    name: string;
    image: string;
    contractAddress: string;
    tokenId: string;
  }
  
  export function useNFTs() {
    const { address } = useAccount();
    const [nfts, setNfts] = useState<INFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0); // Trigger re-fetch
  
    useEffect(() => {
      async function fetchNFTs() {
        if (!address) return;
  
        try {
          setLoading(true);
          setError(null);
          
          const response = await alchemy.nft.getNftsForOwner(address);
          
          const formattedNFTs = response.ownedNfts.map((nft, index) => ({
            id: index + 1,
            name: nft.name || `NFT #${nft.tokenId}`,
            image: nft.image?.originalUrl || nft.image?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
            contractAddress: nft.contract.address,
            tokenId: nft.tokenId,
          }));
  
          setNfts(formattedNFTs);
        } catch (err) {
          setError('Failed to fetch NFTs');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
  
      fetchNFTs();
    }, [address, refresh]); // Add refresh as a dependency
  
    return { nfts, loading, error, refetch: () => setRefresh((prev) => prev + 1) };
  }
  
