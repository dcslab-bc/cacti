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

import org.openapitools.client.models.GatewayOptions
import org.openapitools.client.models.WatchBlocksListenerTypeV1

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Options passed when subscribing to block monitoring.
 *
 * @param channelName Hyperledger Fabric channel to connect to.
 * @param gatewayOptions 
 * @param type 
 * @param startBlock From which block start monitoring. Defaults to latest.
 */


data class WatchBlocksOptionsV1 (

    /* Hyperledger Fabric channel to connect to. */
    @Json(name = "channelName")
    val channelName: kotlin.String,

    @Json(name = "gatewayOptions")
    val gatewayOptions: GatewayOptions,

    @Json(name = "type")
    val type: WatchBlocksListenerTypeV1,

    /* From which block start monitoring. Defaults to latest. */
    @Json(name = "startBlock")
    val startBlock: kotlin.String? = null

)

