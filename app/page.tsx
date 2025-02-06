"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Lock, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Bidding",
    description:
      "Your bids are protected with zero-knowledge proofs on Arbitrum, ensuring complete privacy and security.",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Private Transactions",
    description:
      "All auction activities are confidential, visible only to relevant parties.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Settlement",
    description:
      "Auctions are settled automatically and instantly upon completion.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-bold tracking-tight py-5"
        >
          zkAuction
        </motion.h1>
      </div>
      <div className="container mx-auto px-0 md:px-0 pt-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl"
        >
          <h2 className="text-3xl font-semibold leading-tight">
            The First Zero-Knowledge NFT Auction Platform
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">
            Trade your NFTs with complete privacy on Arbitrum. Our platform
            leverages Arbitrum&apos;s scalability and security while using
            zero-knowledge proofs to ensure your bids remain confidential.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/auctions"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore Auctions
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="container mx-auto px-4 md:px-0 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="rounded-xl bg-white/10 shadow-lg p-6 backdrop-blur-sm"
            >
              <div className="mb-4 rounded-lg bg-primary/10 p-3 text-primary w-fit">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
