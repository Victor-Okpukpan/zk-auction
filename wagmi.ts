import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'zkAuction',
  projectId: process.env.REOWN_PROJECT_ID!,
  chains: [
    arbitrumSepolia
  ],
  ssr: true,
});
