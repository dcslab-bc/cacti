/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// manage_assets is a chaincode that contains all the code related to asset management operations (e.g., Lock, Unlock, Claim)
// and any related utility functions
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"crypto/sha256"
	"encoding/base64"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/golang/protobuf/proto"
	log "github.com/sirupsen/logrus"
	"github.com/hyperledger-labs/weaver-dlt-interoperability/core/network/fabric-interop-cc/contracts/interop/protos-go/common"
)

// Object used in the map, <asset-type, asset-id> --> <contractId, locker, recipient, ...> (for non-fungible assets)
type AssetLockValue struct {
	Locker		string	`json:"locker"`
	Recipient	string	`json:"recipient"`
	Hash		string	`json:"hash"`
	ExpiryTimeSecs	uint64	`json:"expiryTimeSecs"`
}

// Object used in the map, contractId --> <asset-type, num-units, locker, ...> (for fungible assets)
type FungibleAssetLockValue struct {
	Type		string	`json:"type"`
	NumUnits	uint64	`json:"numUnits"`
	Locker		string	`json:"locker"`
	Recipient	string	`json:"recipient"`
	Hash		string	`json:"hash"`
	ExpiryTimeSecs	uint64	`json:"expiryTimeSecs"`
}

const(
	assetKeyPrefix		= "AssetKey_"	// prefix for the map, asset-key --> asset-object
	assetKeyDelimiter	= "_"		// delimiter for the asset-key
	contractIdPrefix	= "ContractId_"	// prefix for the map, contractId --> asset-key
)

// helper functions to log and return errors
func logAndReturnErrorfBool(retVal bool, format string, args ...interface{}) (bool, error) {
    errorMsg := fmt.Sprintf(format, args...)
    log.Error(errorMsg)
    return retVal, errors.New(errorMsg)
}

func logAndReturnErrorfInt(retVal int, format string, args ...interface{}) (int, error) {
    errorMsg := fmt.Sprintf(format, args...)
    log.Error(errorMsg)
    return retVal, errors.New(errorMsg)
}

func logAndReturnErrorfString(retVal string, format string, args ...interface{}) (string, error) {
    errorMsg := fmt.Sprintf(format, args...)
    log.Error(errorMsg)
    return retVal, errors.New(errorMsg)
}

// function to generate a "SHA256" hash in base64 format for a given preimage
func generateSHA256HashInBase64Form(preimage string) string {
	hasher := sha256.New()
	hasher.Write([]byte(preimage))
	shaHash := hasher.Sum(nil)
	shaHashBase64 := base64.StdEncoding.EncodeToString(shaHash)
	return shaHashBase64
}

// function to return the key to fetch an element from the map using contractId
func generateContractIdMapKey(contractId string) string {
	return contractIdPrefix + contractId
}

/*
 * Function to generate asset-lock key (which is combination of asset-type and asset-id)
 * and contract-id (which is a hash on asset-lock key) for the non-fungible asset locking on the ledger
 */
func generateAssetLockKeyAndContractId(ctx contractapi.TransactionContextInterface, assetAgreement *common.AssetExchangeAgreement) (string, string, error) {
	assetLockKey, err := ctx.GetStub().CreateCompositeKey("AssetExchangeContract", []string{assetAgreement.Type, assetAgreement.Id})
	if err != nil {
		errorMsg := fmt.Sprintf("error while creating composite key: %+v", err)
		log.Error(errorMsg)
		return "", "", errors.New(errorMsg)
	}

	contractId := generateSHA256HashInBase64Form(assetLockKey)
	return assetLockKey, contractId, nil
}

/*
 * Function to generate contract-id for fungible asset-locking on the ledger (which is
 * a hash on the attributes of the fungible asset exchange agreement)
 */
func generateFungibleAssetLockContractId(ctx contractapi.TransactionContextInterface, assetAgreement *common.FungibleAssetExchangeAgreement) string {
	preimage := assetAgreement.Type + strconv.Itoa(int(assetAgreement.NumUnits)) +
			assetAgreement.Locker + assetAgreement.Recipient + ctx.GetStub().GetTxID()
	contractId := generateSHA256HashInBase64Form(preimage)
	return contractId
}

// LockAsset cc is used to record locking of an asset on the ledger
func (s *SmartContract) LockAsset(ctx contractapi.TransactionContextInterface, assetAgreementBytes string, lockInfoBytes string) (string, error) {

	assetAgreement := &common.AssetExchangeAgreement{}
	err := proto.Unmarshal([]byte(assetAgreementBytes), assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}
	//display the requested asset agreement
	log.Infof("assetExchangeAgreement: %+v\n", assetAgreement)

	lockInfoHTLC := &common.AssetLockHTLC{}
	err = proto.Unmarshal([]byte(lockInfoBytes), lockInfoHTLC)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}
	//display the passed lock information
	log.Infof("lockInfoHTLC: %+v\n", lockInfoHTLC)

	if lockInfoHTLC.TimeSpec != common.AssetLockHTLC_EPOCH {
		errorMsg := "only EPOCH time is supported at present"
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	assetLockKey, contractId, err := generateAssetLockKeyAndContractId(ctx, assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}

	assetLockVal := AssetLockValue{Locker: assetAgreement.Locker, Recipient: assetAgreement.Recipient, Hash: string(lockInfoHTLC.HashBase64), ExpiryTimeSecs: lockInfoHTLC.ExpiryTimeSecs}

	assetLockValBytes, err := ctx.GetStub().GetState(assetLockKey)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}

	if assetLockValBytes != nil {
		errorMsg := fmt.Sprintf("asset of type %s and ID %s is already locked", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	assetLockValBytes, err = json.Marshal(assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("marshal error: %s", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	err = ctx.GetStub().PutState(assetLockKey, assetLockValBytes)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}

	assetLockKeyBytes, err := json.Marshal(assetLockKey)
	if err != nil {
		errorMsg := fmt.Sprintf("marshal error: %s", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	err = ctx.GetStub().PutState(generateContractIdMapKey(string(contractId)), assetLockKeyBytes)
	if err != nil {
		log.Error(err.Error())
		return "", err
	}
	return contractId, nil
}

// UnLockAsset cc is used to record unlocking of an asset on the ledger
func (s *SmartContract) UnLockAsset(ctx contractapi.TransactionContextInterface, assetAgreementBytes string) error {

	assetAgreement := &common.AssetExchangeAgreement{}
	err := proto.Unmarshal([]byte(assetAgreementBytes), assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return err
	}
	//display the requested asset agreement
	log.Infof("assetExchangeAgreement: %+v\n", assetAgreement)

	assetLockKey, _, err := generateAssetLockKeyAndContractId(ctx, assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	assetLockValBytes, err := ctx.GetStub().GetState(assetLockKey)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if assetLockValBytes == nil {
		errorMsg := fmt.Sprintf("no asset of type %s and ID %s is locked", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	assetLockVal := AssetLockValue{}
	err = json.Unmarshal(assetLockValBytes, &assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	if assetLockVal.Locker != assetAgreement.Locker || assetLockVal.Recipient != assetAgreement.Recipient {
		errorMsg := fmt.Sprintf("cannot unlock asset of type %s and ID %s as it is locked by %s for %s", assetAgreement.Type, assetAgreement.Id, assetLockVal.Locker, assetLockVal.Recipient)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs < assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot unlock asset of type %s and ID %s as the expiry time is not yet elapsed", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(assetLockKey)
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete lock for asset of type %s and ID %s: %v", assetAgreement.Type, assetAgreement.Id, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	return nil
}

// IsAssetLocked cc is used to query the ledger and findout if an asset is locked or not
func (s *SmartContract) IsAssetLocked(ctx contractapi.TransactionContextInterface, assetAgreementBytes string) (bool, error) {

	assetAgreement := &common.AssetExchangeAgreement{}
	err := proto.Unmarshal([]byte(assetAgreementBytes), assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return false, err
	}
	//display the requested asset agreement
	log.Infof("assetExchangeAgreement: %+v\n", assetAgreement)

	assetLockKey, _, err := generateAssetLockKeyAndContractId(ctx, assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return false, err
	}

	assetLockValBytes, err := ctx.GetStub().GetState(assetLockKey)
	if err != nil {
		log.Error(err.Error())
		return false, err
	}

	if assetLockValBytes == nil {
		errorMsg := fmt.Sprintf("no asset of type %s and ID %s is locked", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	assetLockVal := AssetLockValue{}
	err = json.Unmarshal(assetLockValBytes, &assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}
	log.Infof("assetLockVal: %+v\n", assetLockVal)

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("expiry time for asset of type %s and ID %s is already elapsed", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	// '*' for recipient or locker in the query implies that the query seeks status for an arbitrary recipient or locker respectively
	if (assetAgreement.Locker == "*" || assetLockVal.Locker == assetAgreement.Locker) && (assetAgreement.Recipient == "*" || assetLockVal.Recipient == assetAgreement.Recipient) {
		return true, nil
	} else if assetAgreement.Locker == "*" && assetLockVal.Recipient != assetAgreement.Recipient {
		errorMsg := fmt.Sprintf("asset of type %s and ID %s is not locked for %s", assetAgreement.Type, assetAgreement.Id, assetAgreement.Recipient)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	} else if assetAgreement.Recipient == "*" && assetLockVal.Locker != assetAgreement.Locker {
		errorMsg := fmt.Sprintf("asset of type %s and ID %s is not locked by %s", assetAgreement.Type, assetAgreement.Id, assetAgreement.Locker)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	} else if assetLockVal.Locker != assetAgreement.Locker || assetLockVal.Recipient != assetAgreement.Recipient {
		errorMsg := fmt.Sprintf("asset of type %s and ID %s is not locked by %s for %s", assetAgreement.Type, assetAgreement.Id, assetAgreement.Locker, assetAgreement.Recipient)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	return true, nil
}

/*
 * Function to check if hashBase64 is the hash for the preimage preimageBase64.
 * Both the preimage and hash are passed in base64 form.
 */
func checkIfCorrectPreimage(preimageBase64 string, hashBase64 string) (bool, error) {
	funName := "checkIfCorrectPreimage"
	preimage, err := base64.StdEncoding.DecodeString(preimageBase64)
	if err != nil {
		errorMsg := fmt.Sprintf("base64 decode preimage error: %s", err)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	shaHashBase64 := generateSHA256HashInBase64Form(string(preimage))
	if shaHashBase64 == hashBase64 {
		log.Infof("%s: preimage %s is passed correctly.\n", funName, preimage)
	} else {
		log.Infof("%s: preimage %s is not passed correctly.\n", funName, preimage)
		return false, nil
	}
	return true, nil
}

// ClaimAsset cc is used to record claim of an asset on the ledger
func (s *SmartContract) ClaimAsset(ctx contractapi.TransactionContextInterface, assetAgreementBytes string, claimInfoBytes string) error {

	assetAgreement := &common.AssetExchangeAgreement{}
	err := proto.Unmarshal([]byte(assetAgreementBytes), assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return err
	}
	// display the requested asset agreement
	log.Infof("assetExchangeAgreement: %+v\n", assetAgreement)

	claimInfo := &common.AssetClaimHTLC{}
	err = proto.Unmarshal([]byte(claimInfoBytes), claimInfo)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// display the claim information
	log.Infof("claimInfo: %+v\n", claimInfo)

	assetLockKey, _, err := generateAssetLockKeyAndContractId(ctx, assetAgreement)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	assetLockValBytes, err := ctx.GetStub().GetState(assetLockKey)
	if err != nil {
		log.Error(err.Error())
		return err
	}

        if assetLockValBytes == nil {
		errorMsg := fmt.Sprintf("no asset of type %s and ID %s is locked", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	assetLockVal := AssetLockValue{}
	err = json.Unmarshal(assetLockValBytes, &assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	if assetLockVal.Locker != assetAgreement.Locker || assetLockVal.Recipient != assetAgreement.Recipient {
		errorMsg := fmt.Sprintf("cannot claim asset of type %s and ID %s as it is locked by %s for %s", assetAgreement.Type, assetAgreement.Id, assetLockVal.Locker, assetLockVal.Recipient)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot claim asset of type %s and ID %s as the expiry time is already elapsed", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// compute the hash from the preimage
	isCorrectPreimage, err := checkIfCorrectPreimage(string(claimInfo.HashPreimageBase64), string(assetLockVal.Hash))
	if err != nil {
		errorMsg := fmt.Sprintf("claim asset of type %s and ID %s error: %v", assetAgreement.Type, assetAgreement.Id, err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	if isCorrectPreimage == false {
		errorMsg := fmt.Sprintf("cannot claim asset of type %s and ID %s as the hash preimage is not matching", assetAgreement.Type, assetAgreement.Id)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(assetLockKey)
	if err != nil {
		errorMsg := fmt.Sprintf("failed to delete lock for asset of type %s and ID %s: %v", assetAgreement.Type, assetAgreement.Id, err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	return nil
}

// function to fetch the asset-lock <key, value> from the ledger using contractId
func fetchAssetLockedUsingContractId(ctx contractapi.TransactionContextInterface, contractId string) (string, AssetLockValue, error) {
	var assetLockVal = AssetLockValue{}
	var assetLockKey string = ""
	assetLockKeyBytes, err := ctx.GetStub().GetState(generateContractIdMapKey(contractId))
	if err != nil {
		log.Error(err.Error())
		return assetLockKey, assetLockVal, err
	}

	if assetLockKeyBytes == nil {
		errorMsg := fmt.Sprintf("no contractId %s exists on the ledger", contractId)
		log.Error(errorMsg)
		return assetLockKey, assetLockVal, errors.New(errorMsg)
	}

	assetLockKey = string(assetLockKeyBytes)
	log.Infof("contractId: %s and assetLockKey: %s\n", contractId, assetLockKey)

	assetLockValBytes, err := ctx.GetStub().GetState(assetLockKey)
	if err != nil {
		return assetLockKey, assetLockVal, fmt.Errorf("failed to retrieve from the world state: %+v", err)
	}

	if assetLockValBytes == nil {
		errorMsg := fmt.Sprintf("contractId %s is not associated with any currently locked asset", contractId)
		log.Error(errorMsg)
		return assetLockKey, assetLockVal, errors.New(errorMsg)
	}

	err = json.Unmarshal(assetLockValBytes, &assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return assetLockKey, assetLockVal, errors.New(errorMsg)
	}
	return assetLockKey, assetLockVal, nil
}

// UnLockAsset cc is used to record unlocking of an asset on the ledger (this uses the contractId)
func (s *SmartContract) UnLockAssetUsingContractId(ctx contractapi.TransactionContextInterface, contractId string) error {

	assetLockKey, assetLockVal, err := fetchAssetLockedUsingContractId(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs < assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot unlock asset associated with the contractId %s as the expiry time is not yet elapsed", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(assetLockKey)
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete lock for the asset associated with the contractId %s: %v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	err = ctx.GetStub().DelState(generateContractIdMapKey(contractId))
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete the contractId %s as part of asset unlock: %v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	return nil
}

// ClaimAsset cc is used to record claim of an asset on the ledger (this uses the contractId)
func (s *SmartContract) ClaimAssetUsingContractId(ctx contractapi.TransactionContextInterface, contractId string, claimInfoBytes string) error {

	assetLockKey, assetLockVal, err := fetchAssetLockedUsingContractId(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	claimInfo := &common.AssetClaimHTLC{}
	err = proto.Unmarshal([]byte(claimInfoBytes), claimInfo)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// display the claim information
	log.Infof("claimInfo: %+v\n", claimInfo)

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot claim asset associated with contractId %s as the expiry time is already elapsed", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// compute the hash from the preimage
	isCorrectPreimage, err := checkIfCorrectPreimage(string(claimInfo.HashPreimageBase64), string(assetLockVal.Hash))
	if err != nil {
		errorMsg := fmt.Sprintf("claim asset associated with contractId %s failed with error: %v", contractId, err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	if isCorrectPreimage == false {
		errorMsg := fmt.Sprintf("cannot claim asset associated with contractId %s as the hash preimage is not matching", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(assetLockKey)
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete lock for the asset associated with the contractId %s: %+v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	err = ctx.GetStub().DelState(generateContractIdMapKey(contractId))
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete the contractId %s as part of asset claim: %+v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	return nil
}

// IsAssetLocked cc is used to query the ledger and find out if an asset is locked or not (this uses the contractId)
func (s *SmartContract) IsAssetLockedQueryUsingContractId(ctx contractapi.TransactionContextInterface, contractId string) (bool, error) {

	_, assetLockVal, err := fetchAssetLockedUsingContractId(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return false, err
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("expiry time for asset associated with contractId %s is already elapsed", contractId)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	return true, nil
}

// LockFungibleAsset cc is used to record locking of a group of fungible assets of an asset-type on the ledger
func (s *SmartContract) LockFungibleAsset(ctx contractapi.TransactionContextInterface, fungibleAssetAgreementBytes string, lockInfoBytes string) (string, error) {

	assetAgreement := &common.FungibleAssetExchangeAgreement{}
	err := proto.Unmarshal([]byte(fungibleAssetAgreementBytes), assetAgreement)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	//display the requested fungible asset agreement
	log.Infof("fungibleAssetExchangeAgreement: %+v\n", assetAgreement)

	lockInfoHTLC := &common.AssetLockHTLC{}
	err = proto.Unmarshal([]byte(lockInfoBytes), lockInfoHTLC)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	//display the passed lock information
	log.Infof("lockInfoHTLC: %+v\n", lockInfoHTLC)

	if lockInfoHTLC.TimeSpec != common.AssetLockHTLC_EPOCH {
		errorMsg := "only EPOCH time is supported at present"
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	// generate the contractId for the fungible asset lock agreement
	contractId := generateFungibleAssetLockContractId(ctx, assetAgreement)

	assetLockVal := FungibleAssetLockValue{Type: assetAgreement.Type, NumUnits: assetAgreement.NumUnits, Locker: assetAgreement.Locker,
		Recipient: assetAgreement.Recipient, Hash: string(lockInfoHTLC.HashBase64), ExpiryTimeSecs: lockInfoHTLC.ExpiryTimeSecs}

	assetLockValBytes, err := ctx.GetStub().GetState(contractId)
	if err != nil {
		errorMsg := fmt.Sprintf("failed to retrieve from the world state: %+v", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	if assetLockValBytes != nil {
		errorMsg := fmt.Sprintf("contractId %s already exists for the requested fungible asset agreement", contractId)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	assetLockValBytes, err = json.Marshal(assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("marshal error: %s", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	err = ctx.GetStub().PutState(generateContractIdMapKey(contractId), assetLockValBytes)
	if err != nil {
		errorMsg := fmt.Sprintf("failed to write to the world state: %+v", err)
		log.Error(errorMsg)
		return "", errors.New(errorMsg)
	}

	return contractId, nil
}

// function to fetch the fungible asset-lock value from the ledger using contractId
func fetchFungibleAssetLocked(ctx contractapi.TransactionContextInterface, contractId string) (FungibleAssetLockValue, error) {
	var assetLockVal = FungibleAssetLockValue{}

	assetLockValBytes, err := ctx.GetStub().GetState(generateContractIdMapKey(contractId))
	if err != nil {
		errorMsg := fmt.Sprintf("failed to retrieve from the world state: %+v", err)
		log.Error(errorMsg)
		return assetLockVal, errors.New(errorMsg)
	}

	if assetLockValBytes == nil {
		errorMsg := fmt.Sprintf("contractId %s is not associated with any currently locked fungible asset", contractId)
		log.Error(errorMsg)
		return assetLockVal, errors.New(errorMsg)
	}

	err = json.Unmarshal(assetLockValBytes, &assetLockVal)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return assetLockVal, errors.New(errorMsg)
	}
	log.Infof("contractId: %s and fungibleAssetLockVal: %+v\n", contractId, assetLockVal)

	return assetLockVal, nil
}

// IsFungibleAssetLocked cc is used to query the ledger and find out if a fungible asset is locked or not
func (s *SmartContract) IsFungibleAssetLocked(ctx contractapi.TransactionContextInterface, contractId string) (bool, error) {

	assetLockVal, err := fetchFungibleAssetLocked(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return false, err
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("expiry time for fungible asset associated with contractId %s is already elapsed", contractId)
		log.Error(errorMsg)
		return false, errors.New(errorMsg)
	}

	return true, nil
}

// ClaimFungibleAsset cc is used to record claim of a fungible asset on the ledger
func (s *SmartContract) ClaimFungibleAsset(ctx contractapi.TransactionContextInterface, contractId string, claimInfoBytes string) error {

	assetLockVal, err := fetchFungibleAssetLocked(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	claimInfo := &common.AssetClaimHTLC{}
	err = proto.Unmarshal([]byte(claimInfoBytes), claimInfo)
	if err != nil {
		errorMsg := fmt.Sprintf("unmarshal error: %s", err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// display the claim information
	log.Infof("claimInfo: %+v\n", claimInfo)

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs >= assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot claim fungible asset associated with contractId %s as the expiry time is already elapsed", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	// compute the hash from the preimage
	isCorrectPreimage, err := checkIfCorrectPreimage(string(claimInfo.HashPreimageBase64), string(assetLockVal.Hash))
	if err != nil {
		errorMsg := fmt.Sprintf("claim fungible asset associated with contractId %s failed with error: %v", contractId, err)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	if isCorrectPreimage == false {
		errorMsg := fmt.Sprintf("cannot claim fungible asset associated with contractId %s as the hash preimage is not matching", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(generateContractIdMapKey(contractId))
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete the contractId %s as part of fungible asset claim: %+v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	return nil
}

// UnLockFungibleAsset cc is used to record unlocking of a fungible asset on the ledger
func (s *SmartContract) UnLockFungibleAsset(ctx contractapi.TransactionContextInterface, contractId string) error {

	assetLockVal, err := fetchFungibleAssetLocked(ctx, contractId)
	if err != nil {
		log.Error(err.Error())
		return err
	}

	// Check if expiry time is elapsed
	currentTimeSecs := uint64(time.Now().Unix())
	if currentTimeSecs < assetLockVal.ExpiryTimeSecs {
		errorMsg := fmt.Sprintf("cannot unlock fungible asset associated with the contractId %s as the expiry time is not yet elapsed", contractId)
		log.Error(errorMsg)
		return errors.New(errorMsg)
	}

	err = ctx.GetStub().DelState(generateContractIdMapKey(contractId))
	if err != nil {
		errorMessage := fmt.Sprintf("failed to delete the contractId %s as part of fungible asset unlock: %v", contractId, err)
		log.Error(errorMessage)
		return errors.New(errorMessage)
	}

	return nil
}
