# ZK Auction Platform

**This platform uses a state-of-the-art commit–reveal mechanism and zero-knowledge proofs to ensure your bid remains immutable once submitted, delivering a fair and transparent auction process. With our flexible design, auctions can be fast-paced or more deliberate—tailored to your needs.**

## Overview

The ZK Auction Platform is a decentralized application (dApp) deployed on Arbitrum (Sepolia) that provides a secure and transparent environment for NFT auctions. Using a commit–reveal auction scheme combined with zero-knowledge proofs (zk-SNARKs), the platform ensures that all bids remain private until the appropriate phase, and once submitted, are immutable. Bid proofs are verified through [zkVerify](https://docs.zkverify.io/), guaranteeing bid integrity and fairness while offering flexible auction configurations that can be either fast-paced or more extended depending on your needs.


## Features

- **Secure Commit–Reveal Auctions:**  
  Bidders commit their bids in a sealed manner and reveal them later, ensuring that bids cannot be changed after submission.
  
- **Zero-Knowledge Proofs:**  
  Our system leverages zk-SNARKs to generate a cryptographic proof for each submitted bid that is verified using zkVerify. This proof is later utilized on-chain during the reveal phase, ensuring that bid values remain immutable until revealed, preserving the integrity and transparency of the auction process.
  
- **Flexible Auction Configurations:**  
  Configure auctions to be fast-paced or extended to suit your bidding environment.
  
- **NFT Minting for Testing:**  
  Mint NFTs directly from the platform to test auction functionality.
  
- **Real-Time Auction Updates:**  
  Active auctions are automatically updated on-chain via event listeners and polling.
  
- **Automated Finalization:**  
  Chainlink Keepers finalizes auctions automatically after the reveal phase ends.

## Technologies Used

- **Frontend:**  
  - Next.js, React, TypeScript  
  - Tailwind CSS, Framer Motion  
  - Wagmi, ethers.js  
  - RainbowKit for wallet integration
  
- **Smart Contracts:**  
  - Solidity 0.8.26  
  - OpenZeppelin libraries  
  - Chainlink Keepers
  
- **Zero-Knowledge Proofs:**  
  - Circom 2.1.3  
  - snarkjs
  - zkVerify
  
- **NFT Data:**  
  - Alchemy API
  
- **Other Tools:**  
  - Node.js, npm/yarn, Git

## Smart Contracts

- **Auction Manager Contract:**  
  This contract implements the commit–reveal auction mechanism with zk-SNARK verification. It is deployed on Arbitrum (Sepolia).  
  [View and verify the contract on Sepolia Arbiscan](https://sepolia.arbiscan.io/address/0xfb1f1aed080b65f96fd49bc872d6ccf8a96b36c4)

- **NFT Contract:**  
  A standard ERC721 contract for minting test NFTs.  
  [View the NFT contract on Sepolia Arbiscan](https://sepolia.arbiscan.io/address/0xcB26E956ba06d77dea887d74592223148dC9D08c)

## How to Use the Platform

### Minting NFTs for Testing

- **Mint an NFT:**  
  On the auctions page, click the **Mint NFT** button. This action mints a test NFT using the deployed NFT contract on Arbitrum (Sepolia).  
- **View Your NFTs:**  
  Your minted NFTs will appear in your NFT gallery (fetched via the Alchemy API) so you can select one for auction creation.

### Creating an Auction

1. **Select an NFT:**  
   From your NFT gallery, click on an NFT you want to use for auctioning.
   
2. **Open the Auction Modal:**  
   Once you select an NFT, a modal will appear prompting you for auction details.

3. **Fill in Auction Parameters:**  
   - **Start Time:** Specify when the commit phase should begin.
   - **Commit Duration:** Define how long the commit phase will last.
   - **Reveal Duration:** Set the duration for the reveal phase.
   - **Minimum Bid:** Enter the minimum acceptable bid in ETH.
   
4. **Approve Your NFT:**  
   If your NFT is not already approved for transfer, click **Approve NFT**. This action will prompt you to approve your NFT for transfer by the Auction Manager contract. A loading indicator will display while the approval is processed, and a success toast confirms the approval once complete.

5. **Place a Bid (Create Auction):**  
   After approval, click **Place Bid** to create the auction. This action will:
   - Generate a zk-SNARK proof off-chain that validates your bid without revealing it.
   - Send your bid (as a deposit) along with the proof to the smart contract.
   - Show a loading indicator while processing, and a success toast upon auction creation.
   
### Participating in Auctions

- **Bid Commit Phase:**  
  During the commit phase, bidders submit their bids along with a zk-SNARK proof and the necessary deposit. All bids remain hidden from others during this phase.

- **Bid Reveal Phase:**  
  Once the commit phase ends, bidders must reveal their bids.  
  - Click on **Reveal Your Bid** on the auction card.
  - After successfully revealing your bid, the system automatically refetches the auction data.
  
- **Finalization and Auction Results:**  
  When the reveal phase ends, the auction finalizes automatically. The auction card will then display the highest bidder in place of the phase information. This update is performed automatically via scheduled re-fetching, ensuring the results are updated in real time. Furthermore, the NFT is transferred to the highest bidder, the funds sent to the bid creator, and all losing bids are returned to their owners.

### Flexible Auction Configurations

Our platform allows auctions to be set up either as fast-paced events or as more extended bidding periods. Configure the durations (start time, commit duration, and reveal duration) to suit the pace you desire for each auction.

## Developer

- [Victor_TheOracle](https://x.com/victorokpukpan_)

## Relevant Links

- [Smart Contract Repository]()
- [Live URL]()
- [Verified Auction Manager Contract On Arbitrum Sepolia]()
- [Verified NFT Contract On Arbitrum Sepolia]()