export interface NFT {
  id: number;
  name: string;
  image: string;
}

export interface Auction {
  id: number;
  name: string;
  image: string;
  currentBid: string;
  endTime: string;
  totalBids: number;
  minBidIncrement: string;
}
