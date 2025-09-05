// contracts/test/Registry.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {Registry} from "../src/Registry.sol";

contract RegistryTest is Test {
    Registry registry;
    address owner = address(this);
    address notOwner = address(0xBEEF);

    function setUp() public {
        registry = new Registry(owner); // конструктор требует owner
    }

    function test_Owner_CanSetParam() public {
        bytes32 key = keccak256("maxSlippageBps");
        registry.setParam(key, 42);
        assertEq(registry.u256(key), 42);
    }

    function test_RevertWhen_NotOwner_CallsSetParam() public {
        bytes32 key = keccak256("maxSlippageBps");

        vm.prank(notOwner);
        vm.expectRevert(bytes("not owner"));
        registry.setParam(key, 42);
    }

    function test_EmitEvent_OnSetParam() public {
        bytes32 key = keccak256("rebalanceIntervalSec");
        uint256 val = 300;

        vm.expectEmit(true, false, true, true);
        emit ParamSet(key, val, owner);

        registry.setParam(key, val);
    }

    // скопированное из контракта событие для expectEmit
    event ParamSet(bytes32 indexed key, uint256 value, address indexed by);
}
