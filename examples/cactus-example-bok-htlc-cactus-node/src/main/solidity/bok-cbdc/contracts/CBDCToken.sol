// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.2
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CBDCToken is ERC20, ERC20Burnable, Ownable {
    // 잠금된 잔액을 추적하는 매핑
    mapping(address => uint256) public lockBalanceOf;

    // 토큰 전송 전에 잠금 잔액을 확인하는 모디파이어
    modifier checkLockBalance(address _from, uint256 _amount) {
        require(
            _from == address(0) ||
                super.balanceOf(_from) - lockBalanceOf[_from] >= _amount,
            "fromAddress CBDC Balance Check"
        );
        _;
    }

    constructor(
        address initialOwner
    ) ERC20("CBDCTestToken", "WON") Ownable(initialOwner) {}

    // 새로운 토큰을 발행하는 함수 (소유자만 호출 가능)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // 주소의 잠금된 잔액을 증가시키는 함수 (소유자만 호출 가능)
    function increaseLockBalance(
        address from,
        uint256 amount
    ) external onlyOwner {
        require(
            super.balanceOf(from) >= lockBalanceOf[from] + amount,
            "Check CBDC Balance"
        );
        lockBalanceOf[from] += amount;
    }

    // 주소의 잠금된 잔액을 감소시키는 함수 (소유자만 호출 가능)
    function decreaseLockBalance(
        address from,
        uint256 amount
    ) external onlyOwner {
        require(lockBalanceOf[from] >= amount, "Check CBDC Lock Balance");
        lockBalanceOf[from] -= amount;
    }

    // The following functions are overrides required by Solidity.

    // Solidity에서 요구하는 오버라이드를 포함하여 토큰 전송 전에 일시 중지 기능과 잠금 잔액 확인을 추가하는 함수
    function _update(
        address _from,
        address _to,
        uint256 _value
    ) internal override checkLockBalance(_from, _value) {
        super._update(_from, _to, _value);
    }
}