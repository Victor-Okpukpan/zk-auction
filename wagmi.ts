import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'zkAuction',
  projectId: "f9b48cb3dddbeb6d17cb6af6eb640893",
  chains: [
    arbitrumSepolia
  ],
  ssr: true,
});
