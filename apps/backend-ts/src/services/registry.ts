// apps/backend-ts/src/services/registry.ts
import { publicClient, registry } from "../chain";
import { keccak256, stringToHex } from "viem";

/** Читает uint256 из mapping(bytes32=>uint256) по строковому ключу (lowercase/trim) */
export async function readU256(key: string): Promise<bigint> {
  const norm = key.trim().toLowerCase();
  const keyHash = keccak256(stringToHex(norm));
  const value = await publicClient.readContract({
    address: registry.address,
    abi: registry.abi,
    functionName: "u256",
    args: [keyHash],
  });
  return value as bigint;
}

/** Пакетное чтение нескольких ключей → Record<key, bigint> */
export async function readMany(keys: string[]) {
  const result: Record<string, bigint> = {};
  for (const k of keys) {
    result[k] = await readU256(k);
  }
  return result;
}
