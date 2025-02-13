export const zkAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_zkvContract", type: "address", internalType: "address" },
      { name: "_vkHash", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "PROVING_SYSTEM_ID",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasSubmittedValidProof",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proveAttestationId",
    inputs: [
      { name: "attestationId", type: "uint256", internalType: "uint256" },
      { name: "merklePath", type: "bytes32[]", internalType: "bytes32[]" },
      { name: "leafCount", type: "uint256", internalType: "uint256" },
      { name: "index", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vkHash",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "zkvContract",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "SuccessfulProofSubmission",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
];
