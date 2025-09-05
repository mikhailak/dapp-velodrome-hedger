// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Registry.sol";

contract Deploy is Script {
    function run() external {
        // читаем приватный ключ из ENV: PRIVATE_KEY
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast(pk);
        Registry reg = new Registry(owner);
        vm.stopBroadcast();

        console2.log("Registry deployed at:", address(reg));
    }
}
