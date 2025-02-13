export const zkAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_attestationId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "_leaf",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32[]",
          "name": "_merklePath",
          "type": "bytes32[]"
        },
        {
          "internalType": "uint256",
          "name": "_leafCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "verifyProofAttestation",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
  