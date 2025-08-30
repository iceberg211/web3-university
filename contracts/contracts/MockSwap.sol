// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Simple fixed-rate swap for demo: 1 ETH = 4000 YD
contract MockSwap {
    IERC20 public immutable yd;
    uint256 public constant RATE = 4000; // YD per ETH

    constructor(IERC20 _yd) {
        yd = _yd;
    }

    function ethToYD() external payable {
        require(msg.value > 0, "no eth");
        uint256 amount = msg.value * RATE;
        require(yd.transfer(msg.sender, amount), "yd transfer");
    }

    function ydToEth(uint256 amount) external {
        require(amount > 0, "no yd");
        require(yd.transferFrom(msg.sender, address(this), amount), "pull yd");
        uint256 ethOut = amount / RATE;
        (bool ok, ) = msg.sender.call{value: ethOut}("");
        require(ok, "eth send");
    }

    receive() external payable {}
}

