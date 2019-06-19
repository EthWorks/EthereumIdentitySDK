pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract ProxyCounterfactualFactory is Ownable {
    bytes public initCode;

    constructor(bytes memory _initCode) public {
        initCode = _initCode;
    }

    function createContract(address publicKey, bytes memory initializeWithENS) public onlyOwner returns(bool success) {
        bytes20 initializePublicKey = getKeyFromInitializeData(initializeWithENS);
        require(bytes20(publicKey) == initializePublicKey, "Public key and initialize public key are different");
        bytes32 finalSalt = keccak256(abi.encodePacked(publicKey));
        bytes memory _initCode = initCode;
        address contractAddress;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            contractAddress := create2(0, add(_initCode, 0x20), mload(_initCode), finalSalt)
            if iszero(extcodesize(contractAddress)) {revert(0, 0)}
        }
        // solium-disable-next-line security/no-low-level-calls
        (success, ) = contractAddress.call(initializeWithENS);
        require(success, "Unable to register ENS domain");
        return success;
    }

    function getKeyFromInitializeData(bytes memory initializeData) private pure returns(bytes20 publicKey) {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            publicKey := mload(add(initializeData, 0x30))
        }
    }
}
