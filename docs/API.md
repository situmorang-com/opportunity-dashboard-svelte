# API Reference

This document describes all REST API endpoints available in the Sales Opportunity Dashboard.

## Overview

- **Base URL**: `/api`
- **Authentication**: All endpoints require an authenticated session (except `/login`)
- **Content-Type**: Most endpoints accept `multipart/form-data` or `application/json`
- **Response Format**: JSON

## Authentication

All API endpoints require a valid session cookie. Requests without a valid session receive:

```json
{
  "error": "Unauthorized"
}
```

**Status Code**: `401 Unauthorized`

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

Common error codes:
- `400` - Bad Request (validation errors, missing required fields)
- `401` - Unauthorized (no valid session)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Opportunities

### Create Opportunity

**POST** `/api/opportunities`

Creates a new sales opportunity.

**Content-Type**: `multipart/form-data`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Opportunity name |
| `clientId` | number | No | Client ID |
| `stageId` | number | No | Stage ID (defaults to 1) |
| `ownerId` | string | No | Owner user ID (defaults to current user) |
| `value` | number | No | Deal value in dollars |
| `probability` | number | No | Win probability 0-100 (inherits from stage) |
| `expectedCloseDate` | string | No | Expected close date (ISO format) |
| `description` | string | No | Detailed description |
| `fabricWorkloads` | JSON string | No | Array of Fabric workload types |
| `capacityUnits` | number | No | Fabric capacity units |
| `estimatedLicenseCost` | number | No | License cost estimate |
| `estimatedServicesCost` | number | No | Services cost estimate |
| `migrationSource` | string | No | Source platform being migrated |
| `competitor` | string | No | Main competitor |
| `projectDuration` | string | No | Expected project duration |
| `leadSource` | string | No | How the lead was acquired |
| `partnerPic` | string | No | Partner point of contact |
| `authorityName` | string | No | Decision maker name |
| `authorityContact` | string | No | Decision maker phone |
| `authorityEmail` | string | No | Decision maker email |
| `championName` | string | No | Internal champion name |
| `championContact` | string | No | Champion phone |
| `championEmail` | string | No | Champion email |
| `engagementTeam` | string | No | JSON array of team members |
| `documentsFolder` | string | No | Link to documents folder |
| `immediateNextStep` | string | No | Next action item |
| `timeline` | string | No | Project timeline |
| `objectives` | string | No | Client objectives |
| `keyPainPoints` | string | No | Key pain points |
| `initiatives` | string | No | Strategic initiatives |
| `potentialRoadblocks` | string | No | Potential roadblocks |
| `engagementSummary` | string | No | Engagement summary |

**Response**: `201 Created`

```json
{
  "id": 1,
  "title": "Acme Corp Fabric Migration",
  "value": 150000,
  "stageId": 1,
  "clientId": 1,
  "ownerId": "user-123",
  "probability": 10,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Update Opportunity

**PUT** `/api/opportunities/[id]`

Updates an existing opportunity.

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `id` (number) - Opportunity ID

**Request Body**: Same as Create Opportunity

**Response**: `200 OK`

```json
{
  "id": 1,
  "title": "Updated Title",
  "value": 200000,
  ...
}
```

**Errors**:
- `400` - Invalid opportunity ID or missing title
- `404` - Opportunity not found

---

### Delete Opportunity

**DELETE** `/api/opportunities/[id]`

Deletes an opportunity and all related activities.

**URL Parameters**:
- `id` (number) - Opportunity ID

**Response**: `200 OK`

```json
{
  "success": true
}
```

---

### Change Stage

**PATCH** `/api/opportunities/[id]/stage`

Moves an opportunity to a different pipeline stage.

**Content-Type**: `application/json`

**URL Parameters**:
- `id` (number) - Opportunity ID

**Request Body**:

```json
{
  "stageId": 2
}
```

**Response**: `200 OK`

```json
{
  "success": true
}
```

**Notes**:
- Automatically updates probability based on new stage
- Creates a `stage_change` activity record
- Sets `wonDate` if moving to Won stage
- Sets `lostDate` if moving to Lost stage

---

### Close Opportunity

**POST** `/api/opportunities/[id]/close`

Marks an opportunity as Won or Lost.

**Content-Type**: `application/json`

**URL Parameters**:
- `id` (number) - Opportunity ID

**Request Body**:

```json
{
  "type": "won",
  "date": "2024-01-20",
  "reason": "Competitor offered lower price"  // Only for "lost"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"won"` or `"lost"` |
| `date` | string | Yes | Close date (ISO format) |
| `reason` | string | No | Reason for loss (only when `type` is `"lost"`) |

**Response**: `200 OK`

```json
{
  "success": true,
  "opportunity": { ... },
  "stage": {
    "id": 6,
    "name": "Closed Won",
    "isWon": true
  }
}
```

---

## Clients

### Create Client

**POST** `/api/clients`

Creates a new client/company.

**Content-Type**: `multipart/form-data`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Company name |
| `industry` | string | No | Industry vertical |
| `size` | string | No | `"smb"`, `"mid-market"`, or `"enterprise"` |
| `region` | string | No | Geographic region |
| `website` | string | No | Company website |
| `primaryContact` | string | No | Primary contact name |
| `contactEmail` | string | No | Contact email |
| `contactPhone` | string | No | Contact phone |
| `address` | string | No | Physical address |
| `notes` | string | No | Additional notes |

**Response**: `201 Created`

```json
{
  "id": 1,
  "name": "Acme Corporation",
  "industry": "Technology",
  "size": "enterprise",
  "createdById": "user-123",
  ...
}
```

---

### Update Client

**PATCH** `/api/clients/[id]`

Updates an existing client.

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `id` (number) - Client ID

**Request Body**: Same as Create Client

**Response**: `200 OK`

---

## Meetings

### Create Meeting

**POST** `/api/meetings`

Creates a new meeting activity.

**Content-Type**: `multipart/form-data`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Meeting title |
| `opportunityId` | number | Yes | Associated opportunity |
| `scheduledDate` | string | Yes | Date (YYYY-MM-DD) |
| `scheduledTime` | string | No | Time (HH:MM) |
| `description` | string | No | Meeting description |
| `duration` | number | No | Duration in minutes (15, 30, 45, 60, 90, 120) |

**Response**: `201 Created`

```json
{
  "id": 1,
  "type": "meeting",
  "title": "Discovery Call",
  "opportunityId": 1,
  "scheduledAt": "2024-01-20T10:00",
  "status": "planned",
  "duration": 60,
  ...
}
```

---

### Update Meeting

**PATCH** `/api/meetings/[id]`

Updates an existing meeting.

**Content-Type**: `application/json`

**URL Parameters**:
- `id` (number) - Meeting ID

**Request Body**:

```json
{
  "title": "Updated Title",
  "opportunityId": 1,
  "scheduledDate": "2024-01-21",
  "scheduledTime": "14:00",
  "description": "Updated description",
  "duration": 90
}
```

**Response**: `200 OK`

---

### Delete Meeting

**DELETE** `/api/meetings/[id]`

Deletes a meeting.

**URL Parameters**:
- `id` (number) - Meeting ID

**Response**: `200 OK`

```json
{
  "success": true,
  "id": 1
}
```

---

### Log Meeting Outcome

**POST** `/api/meetings/[id]/outcome`

Records the outcome of a completed meeting.

**Content-Type**: `application/json`

**URL Parameters**:
- `id` (number) - Meeting ID

**Request Body**:

```json
{
  "outcome": "Client interested in Power BI integration",
  "nextSteps": "Send proposal by Friday"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outcome` | string | Yes | Meeting outcome summary |
| `nextSteps` | string | Yes | Follow-up actions |

**Response**: `200 OK`

```json
{
  "success": true
}
```

**Notes**:
- Sets meeting status to `"completed"`
- Records `completedAt` timestamp
- Updates the opportunity's `immediateNextStep` field

---

### Reschedule Meeting

**POST** `/api/meetings/[id]/reschedule`

Reschedules a meeting to a new date/time.

**Content-Type**: `application/json`

**URL Parameters**:
- `id` (number) - Meeting ID

**Request Body**:

```json
{
  "scheduledDate": "2024-01-25",
  "scheduledTime": "15:00"
}
```

**Response**: `200 OK`

```json
{
  "success": true
}
```

---

## Admin - Users

> **Note**: These endpoints require `admin` role, or `manager` role for GET.

### List Users

**GET** `/api/admin/users`

Returns all users with opportunity counts.

**Required Role**: `admin` or `manager`

**Response**: `200 OK`

```json
[
  {
    "id": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "rep",
    "avatarUrl": "https://...",
    "googleId": "google-123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "opportunityCount": 5
  }
]
```

---

### Create User

**POST** `/api/admin/users`

Pre-registers a new user (they can then login via Google SSO).

**Required Role**: `admin`

**Content-Type**: `application/json`

**Request Body**:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "rep"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's display name |
| `email` | string | Yes | Email address (must be unique) |
| `role` | string | No | `"admin"`, `"manager"`, or `"rep"` (default: `"rep"`) |

**Response**: `200 OK`

```json
{
  "id": "user-456",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "rep",
  "opportunityCount": 0
}
```

**Errors**:
- `400` - Missing name/email or email already exists

---

### Update User

**PUT** `/api/admin/users/[id]`

Updates a user's information.

**Required Role**: `admin`

**URL Parameters**:
- `id` (string) - User ID

**Request Body**:

```json
{
  "name": "Jane Smith Updated",
  "email": "jane.new@example.com",
  "role": "manager"
}
```

**Response**: `200 OK`

---

### Delete User

**DELETE** `/api/admin/users/[id]`

Deletes a user account.

**Required Role**: `admin`

**URL Parameters**:
- `id` (string) - User ID

**Response**: `200 OK`

```json
{
  "success": true
}
```

**Errors**:
- `400` - Cannot delete yourself or user owns opportunities

---

## Admin - Stages

> **Note**: These endpoints require `admin` role, or `manager` role for GET.

### List Stages

**GET** `/api/admin/stages`

Returns all pipeline stages with opportunity counts.

**Required Role**: `admin` or `manager`

**Response**: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Lead",
    "order": 1,
    "probability": 10,
    "color": "#6366f1",
    "description": "Initial contact",
    "isWon": false,
    "isLost": false,
    "opportunityCount": 12
  }
]
```

---

### Create Stage

**POST** `/api/admin/stages`

Creates a new pipeline stage.

**Required Role**: `admin`

**Content-Type**: `application/json`

**Request Body**:

```json
{
  "name": "Qualification",
  "probability": 25,
  "color": "#10b981",
  "description": "Qualified lead",
  "isWon": false,
  "isLost": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Stage name |
| `probability` | number | No | Default probability 0-100 |
| `color` | string | No | Hex color code (default: `#6b7280`) |
| `description` | string | No | Stage description |
| `isWon` | boolean | No | Marks as "Closed Won" stage |
| `isLost` | boolean | No | Marks as "Closed Lost" stage |

**Response**: `200 OK`

**Notes**:
- Order is automatically assigned (appended to end)

---

### Update Stage

**PUT** `/api/admin/stages/[id]`

Updates a stage's properties.

**Required Role**: `admin`

**URL Parameters**:
- `id` (number) - Stage ID

**Request Body**:

```json
{
  "name": "Updated Name",
  "probability": 30,
  "color": "#ef4444",
  "order": 2
}
```

**Response**: `200 OK`

**Notes**:
- Changing `order` automatically reorders other stages

---

### Delete Stage

**DELETE** `/api/admin/stages/[id]`

Deletes a pipeline stage.

**Required Role**: `admin`

**URL Parameters**:
- `id` (number) - Stage ID

**Response**: `200 OK`

```json
{
  "success": true
}
```

**Errors**:
- `400` - Stage has opportunities (must move them first)

---

## Response Codes Summary

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (no session or insufficient role) |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## Examples

### cURL - Create Opportunity

```bash
curl -X POST http://localhost:5173/api/opportunities \
  -H "Cookie: session=your-session-cookie" \
  -F "title=New Fabric Project" \
  -F "clientId=1" \
  -F "value=100000" \
  -F "stageId=1"
```

### cURL - Change Stage

```bash
curl -X PATCH http://localhost:5173/api/opportunities/1/stage \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"stageId": 2}'
```

### cURL - Close as Won

```bash
curl -X POST http://localhost:5173/api/opportunities/1/close \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"type": "won", "date": "2024-01-20"}'
```

### Fetch API - Create Meeting

```javascript
const response = await fetch('/api/meetings', {
  method: 'POST',
  body: new FormData({
    title: 'Discovery Call',
    opportunityId: '1',
    scheduledDate: '2024-01-20',
    scheduledTime: '10:00',
    duration: '60'
  })
});

const meeting = await response.json();
```

### Fetch API - Log Outcome

```javascript
await fetch(`/api/meetings/${meetingId}/outcome`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    outcome: 'Client approved POC',
    nextSteps: 'Setup technical environment'
  })
});
```
