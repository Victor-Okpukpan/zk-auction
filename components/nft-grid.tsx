/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface NFTGridProps {
  nfts: any[]
  onNFTClick: (nft: any) => void
}

export function NFTGrid({ nfts, onNFTClick }: NFTGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {nfts.map((nft) => (
        <motion.div key={nft.id} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} className="group">
          <Card
            className="cursor-pointer overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => onNFTClick(nft)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={nft.image || "/placeholder.svg"}
                  alt={nft.name}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Badge className="absolute top-2 right-2 bg-primary/80 text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NFT
                </Badge>
              </div>
              <div className="p-3 bg-gradient-to-b from-gray-800 to-gray-900">
                <h3 className="text-sm font-semibold truncate text-gray-100 group-hover:text-primary transition-colors duration-300">
                  {nft.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1 truncate">{nft.collection || "Unique Collection"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

