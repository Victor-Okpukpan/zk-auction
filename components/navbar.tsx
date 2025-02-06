"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <div className="flex items-center justify-between">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-5xl font-bold tracking-tight"
      >
        zkAuction
      </motion.h1>
      <ConnectButton />
    </div>
  );
}
