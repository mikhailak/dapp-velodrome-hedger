// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Registry} from "../src/Registry.sol";

contract DeployRegistry is Script {
    function run() external {
        // поднимем приватный ключ из переменной окружения или захардкоженного тестового
        uint256 pk = vm.envOr("PK", uint256(0));
        if (pk == 0) {
            // дефолтный приватный ключ первого аккаунта anvil (только для локалки!)
            pk = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        address owner = vm.envOr("OWNER", address(0));
        if (owner == address(0)) {
            // первый аккаунт anvil
            owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        }

        vm.startBroadcast(pk);
        Registry reg = new Registry(owner);
        vm.stopBroadcast();

        console2.log("Registry deployed at:", address(reg));
        console2.log("Owner:", owner);
    }
}
