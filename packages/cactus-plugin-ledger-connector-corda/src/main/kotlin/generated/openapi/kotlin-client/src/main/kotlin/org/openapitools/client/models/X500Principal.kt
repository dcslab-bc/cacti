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
 * @param name 
 * @param encoded Base64 encoded public key
 */


data class X500Principal (

    @Json(name = "name")
    val name: kotlin.String,

    /* Base64 encoded public key */
    @Json(name = "encoded")
    val encoded: kotlin.String

)

