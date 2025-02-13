/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Gavel, Timer } from "lucide-react"
import { Dialog } from "@headlessui/react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { auctionAbi } from "@/lib/AuctionAbi"
import vk from "../circuits/veekey.json"
import { ethers } from "ethers"
import { zkAbi } from "@/lib/zkAbi"

// -------------------------------
// Interfaces
// -------------------------------
interface IBidCommit {
  bidder: string
  deposit: string
  bidCommitment: string
  revealed: boolean
  bidValue: string
  refunded: boolean
}

interface IAuction {
  id: number
  seller: string
  nftAddress: string
  tokenId: string
  minBid: string
  startTime: number
  commitEndTime: number
  revealEndTime: number
  closed: boolean
  highestBidder: string
  bids: IBidCommit[]
}

// -------------------------------
// Utility Functions
// -------------------------------
const formatCountdown = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hrs}h ${mins}m ${secs}s`
}

// -------------------------------
// AuctionCard Component
// -------------------------------
interface AuctionCardProps {
  auction: IAuction
}

function AuctionCard({ auction }: AuctionCardProps) {
  const [imageUrl, setImageUrl] = useState<string>("")

  useEffect(() => {
    const fetchNFTMetadata = async () => {
      if (!auction.nftAddress || !auction.tokenId) return
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ARB_RPC_URL)
        const nftContract = new ethers.Contract(
          auction.nftAddress,
          ["function tokenURI(uint256 tokenId) view returns (string)"],
          provider,
        )
        const tokenURI = await nftContract.tokenURI(auction.tokenId)
        const metadataURI = tokenURI.startsWith("ipfs://")
          ? tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : tokenURI
        const response = await fetch(metadataURI)
        const metadata = await response.json()
        let img = metadata.image
        if (img && img.startsWith("ipfs://")) {
          img = img.replace("ipfs://", "https://ipfs.io/ipfs/")
        }
        setImageUrl(img)
      } catch (error) {
        console.error("Error fetching NFT metadata:", error)
      }
    }

    fetchNFTMetadata()
  }, [auction.nftAddress, auction.tokenId])

  return (
    <img
      src={imageUrl || "/placeholder.svg"}
      alt={`Auction ${auction.id}`}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
    />
  )
}

// -------------------------------
// AuctionList Component
// -------------------------------
export default function AuctionList() {
  const { writeContractAsync } = useWriteContract()
  const { toast } = useToast()
  const { isConnected } = useAccount()
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loadingProof, setLoadingProof] = useState(false)
  const [proofVerified, setProofVerified] = useState(false)
  const [bidCommitment, setBidCommitment] = useState<string | null>(null)
  const [generatedSalt, setGeneratedSalt] = useState<string | null>(null)
  const [auctions, setAuctions] = useState<IAuction[]>([])
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))
  // State to store the last toasted phase for each auction
  const [toastedPhases, setToastedPhases] = useState<Record<number, string>>({})

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_MANAGER! as `0x{string}`

  // Helper function to compute the highest bid from revealed bids
  const getHighestBid = (auction: IAuction): string => {
    const revealedBids = auction.bids.filter((bid) => bid.revealed)
    if (revealedBids.length === 0) return "0"
    let highest = ethers.BigNumber.from(revealedBids[0].bidValue)
    revealedBids.forEach((bid) => {
      const value = ethers.BigNumber.from(bid.bidValue)
      if (value.gt(highest)) highest = value
    })
    return highest.toString()
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // -------------------------------
  // Auction Phase & Toasts
  // -------------------------------
  const getAuctionPhase = (auction: IAuction) => {
    const startTimeNum = typeof auction.startTime === "bigint" ? Number(auction.startTime) : auction.startTime
    const commitEndTimeNum = typeof auction.commitEndTime === "bigint" ? Number(auction.commitEndTime) : auction.commitEndTime
    const revealEndTimeNum = typeof auction.revealEndTime === "bigint" ? Number(auction.revealEndTime) : auction.revealEndTime

    if (currentTime < startTimeNum) {
      return { phase: "Not Started", countdown: startTimeNum - currentTime }
    } else if (currentTime >= startTimeNum && currentTime < commitEndTimeNum) {
      return { phase: "Commit Phase", countdown: commitEndTimeNum - currentTime }
    } else if (currentTime >= commitEndTimeNum && currentTime < revealEndTimeNum) {
      return { phase: "Reveal Phase", countdown: revealEndTimeNum - currentTime }
    } else {
      return { phase: "Completed", countdown: 0 }
    }
  }

  // Only toast when a phase changes (excluding initial load and Completed)
  useEffect(() => {
    auctions.forEach((auction) => {
      const { phase } = getAuctionPhase(auction)
      // If we haven't stored a phase yet, set it without toasting.
      if (toastedPhases[auction.id] === undefined) {
        setToastedPhases((prev) => ({ ...prev, [auction.id]: phase }))
      } else if (toastedPhases[auction.id] !== phase && phase !== "Completed") {
        toast({
          variant: "default",
          title: `Auction #${auction.id} Phase Change`,
          description: `Auction #${auction.id} is now in ${phase}.`,
        })
        setToastedPhases((prev) => ({ ...prev, [auction.id]: phase }))
      }
    })
  }, [auctions, currentTime, toast, toastedPhases])

  // -------------------------------
  // Proof Generation
  // -------------------------------
  const generateProof = async (bidValue: string, minBid: any) => {
    const randomSalt = BigInt(Math.floor(Math.random() * 1e12)).toString()
    const input = {
      bid: bidValue,
      salt: randomSalt,
      minBid: minBid,
    }
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "/bid_range_commit.wasm",
      "/circuit_final.zkey",
    )
    return { proof, publicSignals, randomSalt }
  }

  // -------------------------------
  // Stage 1: Verify Proof
  // -------------------------------
  const handleVerifyProof = async () => {
    if (!selectedAuction || !bidAmount) return
    setLoadingProof(true)
    try {
      console.log("Verifying proof for auction:", selectedAuction.id, "with bid amount:", bidAmount)
      const bidValueWeiStr = ethers.utils.parseEther(bidAmount).toString()
      const minBidWeiStr = selectedAuction.minBid

      const { proof, publicSignals, randomSalt } = await generateProof(bidValueWeiStr, minBidWeiStr)

      const response = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, publicSignals, vk }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Proof verification failed")
      }
      console.log("API verification data:", data)

      const { attestationId, merklePath, leaf, leafCount, index } = data
      const formattedMerklePath = merklePath.map((val: ethers.utils.BytesLike) =>
        ethers.utils.hexZeroPad(val, 32)
      )

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const zkVerifyAddress = process.env.NEXT_PUBLIC_ZKVERIFY_ADDRESS
      if (!zkVerifyAddress) throw new Error("zkVerify contract address not set")

      const zkContract = new ethers.Contract(zkVerifyAddress, zkAbi, signer)
      const verified = await zkContract.verifyProofAttestation(
        attestationId,
        leaf,
        formattedMerklePath,
        leafCount,
        index,
      )

      if (!verified) {
        throw new Error("On-chain proof verification failed")
      }

      setBidCommitment(publicSignals[0])
      setGeneratedSalt(randomSalt)
      setProofVerified(true)

      toast({
        variant: "default",
        title: "Proof Verified",
        description: "Your zk proof has been verified on-chain. Please proceed to place your bid.",
      })
    } catch (error) {
      console.error("Error during proof verification:", error)
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "There was an error verifying your proof. Please try again.",
      })
    }
    setLoadingProof(false)
  }

  // -------------------------------
  // Stage 2: Commit Bid
  // -------------------------------
  const handleCommitBid = async () => {
    if (!selectedAuction || !bidCommitment || !bidAmount) return
    try {
      const bidValueBN = ethers.utils.parseEther(bidAmount)
      const result = await writeContractAsync({
        abi: auctionAbi,
        address: CONTRACT_ADDRESS,
        functionName: "commitBid",
        args: [selectedAuction.id, bidCommitment],
        value: bidValueBN.toBigInt(),
      })
      console.log("Bid committed:", result)
      localStorage.setItem(
        `bidData-${selectedAuction.id}`,
        JSON.stringify({
          bidValue: bidValueBN.toString(),
          randomSalt: generatedSalt,
        }),
      )
      toast({
        variant: "default",
        title: "Bid Submitted",
        description: "Your bid has been placed.",
      })
      setIsOpen(false)
      setBidAmount("")
      setProofVerified(false)
      setBidCommitment(null)
    } catch (error) {
      console.error("Error during bid commitment:", error)
      toast({
        variant: "destructive",
        title: "Bid Submission Failed",
        description: "There was an error placing your bid. Please try again.",
      })
    }
  }

  const { data: activeAuctionsOnChain, refetch: refetchAuctions } = useReadContract({
    abi: auctionAbi,
    address: CONTRACT_ADDRESS,
    functionName: "getActiveAuctions",
  })

  const handleRevealBids = async (id: number) => {
    try {
      const storedBidData = localStorage.getItem(`bidData-${id}`)
      if (storedBidData) {
        const { bidValue, randomSalt } = JSON.parse(storedBidData)
        const result = await writeContractAsync({
          abi: auctionAbi,
          address: CONTRACT_ADDRESS,
          functionName: "revealBid",
          args: [id, bidValue, randomSalt],
        })
        refetchAuctions()
        toast({
          variant: "default",
          title: "Bids Revealed",
          description: "Your bid has been revealed successfully!",
        })
      }
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Bid Reveal Failed",
        description: "Your bid reveal has failed. Please contact the auction owner.",
      })
    }
  }

  useEffect(() => {
    if (activeAuctionsOnChain) {
      setAuctions(activeAuctionsOnChain as IAuction[])
    }
  }, [activeAuctionsOnChain])

  useEffect(() => {
    if (auctions.length === 0) return

    const activeRevealAuctions = auctions.filter((auction) => {
      const revealEnd =
        typeof auction.revealEndTime === "bigint" ? Number(auction.revealEndTime) : auction.revealEndTime
      return currentTime < revealEnd
    })

    if (activeRevealAuctions.length === 0) return

    const nextRevealEnd = Math.min(
      ...activeRevealAuctions.map((auction) =>
        typeof auction.revealEndTime === "bigint" ? Number(auction.revealEndTime) : auction.revealEndTime,
      ),
    )

    const delaySeconds = nextRevealEnd - currentTime

    if (delaySeconds > 0) {
      const timeout = setTimeout(() => {
        refetchAuctions()
      }, delaySeconds * 1000)
      return () => clearTimeout(timeout)
    }
  }, [auctions, currentTime, refetchAuctions])

  return (
    <>
      {auctions.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-lg font-semibold">No Active Auctions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction, i) => {
            const { phase, countdown } = getAuctionPhase(auction)
            const isCompleted = phase === "Completed" || auction.closed
            return (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group overflow-hidden rounded-xl bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl dark:bg-card/40"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <AuctionCard auction={auction} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Auction #{auction.id}</h3>
                    {isCompleted ? (
                      <span className="bg-gray-600 text-white text-[10px] px-2 py-1 rounded">Completed</span>
                    ) : (
                      <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      <span>{ethers.utils.formatEther(auction.minBid)} ETH</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{formatCountdown(countdown)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Current Phase: <strong>{phase}</strong>
                  </p>
                  {auction.highestBidder !== "0x0000000000000000000000000000000000000000" && (
                    <p className="text-[10px] text-muted-foreground">
                      Highest Bidder: <strong>{auction.highestBidder}</strong>
                    </p>
                  )}
                  {phase === "Completed" && auction.bids.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Highest Bid: <strong>{ethers.utils.formatEther(getHighestBid(auction))} ETH</strong>
                    </p>
                  )}
                  {/* Hide the bid button if Completed */}
                  {phase !== "Completed" && (
                    <>
                      {phase === "Reveal Phase" ? (
                        <button
                          onClick={() => {
                            handleRevealBids(auction.id)
                            toast({
                              variant: "default",
                              title: "Reveal Phase Active",
                              description: `Auction #${auction.id} is now in Reveal Phase.`,
                            })
                          }}
                          className="w-full rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                        >
                          Reveal Your Bid
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (phase === "Not Started") return
                            if (!isConnected) {
                              toast({
                                variant: "destructive",
                                title: "Your wallet is not connected!",
                                description: "Connect your wallet and try again.",
                              })
                              return
                            }
                            setSelectedAuction(auction)
                            setIsOpen(true)
                          }}
                          disabled={phase === "Not Started"}
                          className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                            phase === "Not Started"
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {phase === "Not Started" ? "Not Started" : "Place Bid"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false)
          setProofVerified(false)
          setBidCommitment(null)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
            <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white">
              Place Bid on Auction #{selectedAuction?.id}
            </Dialog.Title>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Minimum bid:{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedAuction ? `${ethers.utils.formatEther(selectedAuction.minBid)} ETH` : ""}
                </span>
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your bid amount (ETH)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    min={Number(selectedAuction ? ethers.utils.formatEther(selectedAuction.minBid) : 0)}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-black"
                    placeholder={selectedAuction ? `Min. ${ethers.utils.formatEther(selectedAuction.minBid)}` : ""}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm dark:text-gray-400">ETH</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {!proofVerified ? (
                  <button
                    onClick={handleVerifyProof}
                    disabled={
                      !bidAmount ||
                      loadingProof ||
                      (selectedAuction &&
                        Number.parseFloat(bidAmount) < Number.parseFloat(ethers.utils.formatEther(selectedAuction.minBid)))
                    }
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {loadingProof ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying Proof...
                      </>
                    ) : (
                      "Verify Proof"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCommitBid}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                  >
                    Confirm Bid
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setProofVerified(false)
                    setBidCommitment(null)
                  }}
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
