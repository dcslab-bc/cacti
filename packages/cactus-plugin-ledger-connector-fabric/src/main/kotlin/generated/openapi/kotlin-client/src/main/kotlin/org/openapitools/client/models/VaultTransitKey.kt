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
import com.squareup.moshi.JsonClass

/**
 * vault key details for signing fabric message with private key stored with transit engine.
 *
 * @param keyName label of private key
 * @param token token for accessing private key
 */


data class VaultTransitKey (

    /* label of private key */
    @Json(name = "keyName")
    val keyName: kotlin.String,

    /* token for accessing private key */
    @Json(name = "token")
    val token: kotlin.String

)

