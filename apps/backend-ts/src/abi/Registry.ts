export const RegistryAbi = [
    { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
    { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "bytes32", "name": "key", "type": "bytes32" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "setParam", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "u256", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  ] as const;