import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { RegistryAbi } from "./abi/Registry";

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;

export const publicClient = createPublicClient({ chain: anvil, transport: http(RPC_URL) });

export const walletClient = PRIVATE_KEY
  ? createWalletClient({
      chain: anvil,
      transport: http(RPC_URL),
      account: privateKeyToAccount(PRIVATE_KEY),
    })
  : null;

export const registry = {
  address: REGISTRY_ADDRESS,
  abi: RegistryAbi,
} as const;
