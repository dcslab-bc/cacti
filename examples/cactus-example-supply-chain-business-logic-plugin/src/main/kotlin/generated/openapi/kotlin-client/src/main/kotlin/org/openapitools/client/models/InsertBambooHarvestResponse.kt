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
 * 
 *
 * @param callOutput 
 * @param transactionReceipt 
 */


data class InsertBambooHarvestResponse (

    @Json(name = "callOutput")
    val callOutput: kotlin.collections.Map<kotlin.String, kotlin.Any>? = null,

    @Json(name = "transactionReceipt")
    val transactionReceipt: kotlin.collections.Map<kotlin.String, kotlin.Any>? = null

)

