// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Courses is Ownable {
    struct Course {
        uint256 price; // in YD (18 decimals)
        address author;
        bool exists;
    }

    IERC20 public immutable yd;
    uint256 public feeBps; // platform fee in bps
    address public feeRecipient;

    mapping(bytes32 => Course) public courses; // id => course
    mapping(bytes32 => mapping(address => bool)) public purchased; // id => user => bool

    event CourseCreated(bytes32 indexed id, address indexed author, uint256 price);
    event CoursePurchased(bytes32 indexed id, address indexed user, uint256 price, uint256 fee);

    constructor(IERC20 _yd, address _owner, address _feeRecipient, uint256 _feeBps) Ownable(_owner) {
        yd = _yd;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    function createCourse(bytes32 id, uint256 price, address author) external {
        require(!courses[id].exists, "exists");
        courses[id] = Course({price: price, author: author, exists: true});
        emit CourseCreated(id, author, price);
    }

    function setFee(address recipient, uint256 bps) external onlyOwner {
        require(bps <= 1000, "fee too high");
        feeRecipient = recipient;
        feeBps = bps;
    }

    function hasPurchased(bytes32 id, address user) external view returns (bool) {
        return purchased[id][user];
    }

    function buyCourse(bytes32 id) external {
        Course memory c = courses[id];
        require(c.exists, "not found");
        require(!purchased[id][msg.sender], "already");
        uint256 fee = (c.price * feeBps) / 10000;
        uint256 authorAmt = c.price - fee;

        // pull tokens
        require(yd.transferFrom(msg.sender, c.author, authorAmt), "pay author failed");
        if (fee > 0 && feeRecipient != address(0)) {
            require(yd.transferFrom(msg.sender, feeRecipient, fee), "pay fee failed");
        }

        purchased[id][msg.sender] = true;
        emit CoursePurchased(id, msg.sender, c.price, fee);
    }
}
