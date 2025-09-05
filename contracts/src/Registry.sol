// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Registry {
    address public owner;
    mapping(bytes32 => uint256) public u256;   // произвольные числовые параметры по ключу
    event ParamSet(bytes32 indexed key, uint256 value, address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function setParam(bytes32 key, uint256 value) external onlyOwner {
        u256[key] = value;
        emit ParamSet(key, value, msg.sender);
    }
}
