'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function CreateAuctionButton() {
  return (
    <Link
      href="/auctions/create"
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <Plus className="h-5 w-5" />
      Create Auction
    </Link>
  );
}
