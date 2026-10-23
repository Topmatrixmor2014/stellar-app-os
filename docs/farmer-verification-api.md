# Farmer Verification API — Third-Party Integrations

## Overview

The Farmer Verification API provides third-party partner platforms, lenders, insurers, and financial institutions with a privacy-preserving, attested view of a farmer's verification state.

This integration answers three critical counterparty questions without exposing PII (Personally Identifiable Information) or unredacted identity documents:

1. **Identity**: Has a verified agent checked the farmer against a valid national document (NIN, voter card, passport, driver's licence)?
2. **Land Ownership**: Has an authorized verifier confirmed the agricultural plot, tenure type (customary, freehold, leasehold, tenancy), coordinates, and hectarage?
3. **Credit Availability**: Is the farmer currently eligible for credit facilities or financing, and on what certification tier (`full`, `standard`, `basic`)?

---

## Authentication

All requests to `/api/v1/farmers/*` must be authenticated with an API key:

```http
GET /api/v1/farmers/GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF/verification HTTP/1.1
Host: api.farmcredit.org
X-API-Key: fc_live_your_partner_key
Accept: application/json
```

Or via the `Authorization` header:

```http
Authorization: ApiKey fc_live_your_partner_key
```

### Rate Limits & Quotas

Responses include headers reflecting your partner quota:

- `X-API-Tier`: `standard` | `partner` | `internal`
- `X-API-Version`: `v1`
- `Cache-Control`: `private, no-store, max-age=0`

---

## Endpoints

### 1. Single Farmer Verification

`GET /api/v1/farmers/{farmerAddress}/verification`

#### Request Parameters
- `farmerAddress` (path parameter): A 56-character Stellar public key starting with `G`.

#### Response Example (`200 OK`)

```json
{
  "farmerAddress": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  "apiVersion": "v1",
  "verificationStatus": "verified",
  "verified": true,
  "identity": {
    "verified": true,
    "verifiedAt": "2026-07-01T10:00:00.000Z",
    "documentType": "nin"
  },
  "land": {
    "verified": true,
    "verifiedAt": "2026-07-02T10:00:00.000Z",
    "ownershipType": "customary",
    "plotSizeHectares": 3.5,
    "region": "Kano",
    "gpsCoordinates": {
      "latitude": 11.98,
      "longitude": 8.55
    }
  },
  "certification": {
    "eligible": true,
    "tier": "full",
    "blockers": [],
    "advisories": [],
    "rulesetVersion": "kyc-eligibility-v1"
  },
  "credit": {
    "available": true,
    "tier": "full",
    "blockers": [],
    "advisories": [],
    "applicationSettled": false,
    "sanctionsClear": true
  },
  "consent": {
    "granted": true
  },
  "checkedAt": "2026-10-22T16:00:00.000Z"
}
```

#### Error Codes

- `400 Bad Request`: `invalid_address` — `farmerAddress` is not a valid 56-character Stellar public key.
- `401 Unauthorized`: Missing or invalid API key credentials.
- `403 Forbidden`: `consent_denied` — The farmer has not granted consent for third-party disclosure.
- `404 Not Found`: `not_found` — No verification application on record for this farmer address.
- `503 Service Unavailable`: Verification data source or authentication service is temporarily unavailable.

---

### 2. Batch Verification for Partner Portfolios

`POST /api/v1/farmers/verification`

Submit 1 to 100 Stellar public keys in a single round-trip.

#### Request Body

```json
{
  "addresses": [
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF"
  ]
}
```

#### Response (`200 OK`)

```json
{
  "requested": 2,
  "count": 1,
  "verified": 1,
  "reports": [
    {
      "farmerAddress": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      "apiVersion": "v1",
      "verificationStatus": "verified",
      "verified": true,
      "identity": { "verified": true, "verifiedAt": "2026-07-01T10:00:00.000Z", "documentType": "nin" },
      "land": { "verified": true, "verifiedAt": "2026-07-02T10:00:00.000Z", "ownershipType": "customary", "plotSizeHectares": 3.5, "region": "Kano", "gpsCoordinates": { "latitude": 11.98, "longitude": 8.55 } },
      "certification": { "eligible": true, "tier": "full", "blockers": [], "advisories": [], "rulesetVersion": "kyc-eligibility-v1" },
      "credit": { "available": true, "tier": "full", "blockers": [], "advisories": [], "applicationSettled": false, "sanctionsClear": true },
      "consent": { "granted": true },
      "checkedAt": "2026-10-22T16:00:00.000Z"
    }
  ],
  "notFound": [],
  "consentDenied": [
    "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF"
  ]
}
```

---

## Privacy Architecture

To adhere to national data protection and blockchain verification ethics:
- Evidence images, raw document numbers, phone numbers, and dates of birth are strictly kept behind zero-knowledge and KYC attestation layers.
- If consent is not explicitly confirmed by the farmer, the API returns `consent_denied` (`403 Forbidden`) or aggregates the address into `consentDenied` rather than leaking partial data.
