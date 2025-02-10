/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

interface NFTGridProps {
  nfts: any[]
  onNFTClick: (nft: any) => void
}

export function NFTGrid({ nfts, onNFTClick }: NFTGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {nfts.map((nft) => (
        <motion.div key={nft.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="cursor-pointer overflow-hidden" onClick={() => onNFTClick(nft)}>
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image src={nft.image} alt={nft.name} layout="fill" objectFit="cover" />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium truncate">{nft.name}</h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

