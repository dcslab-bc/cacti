/**
 *
 * Please note:
 * This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit this file manually.
 *
 */

@file:Suppress(
    "ArrayInDataClass",
    "EnumEntryName",
    "RemoveRedundantQualifierName",
    "UnusedImport"
)

package org.openapitools.client.models


import com.squareup.moshi.Json

/**
 * Web3SigningCredential
 *
 * @param type 
 */


interface InitializeRequestWeb3SigningCredential {

    @Json(name = "type")
    val type: InitializeRequestWeb3SigningCredential.Type?
    /**
     * 
     *
     * Values: cACTUSKEYCHAINREF,gETHKEYCHAINPASSWORD,pRIVATEKEYHEX,nONE
     */
    enum class Type(val value: kotlin.Any) {
        @Json(name = ""CACTUS_KEYCHAIN_REF"") cACTUSKEYCHAINREF("CACTUS_KEYCHAIN_REF"),
        @Json(name = ""GETH_KEYCHAIN_PASSWORD"") gETHKEYCHAINPASSWORD("GETH_KEYCHAIN_PASSWORD"),
        @Json(name = ""PRIVATE_KEY_HEX"") pRIVATEKEYHEX("PRIVATE_KEY_HEX"),
        @Json(name = ""NONE"") nONE("NONE");
    }
}

