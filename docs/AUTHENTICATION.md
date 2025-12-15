# Authentication Documentation

## Overview
hexcore-cli supports JWT bearer token authentication with the Hydra API. You authenticate using username/password credentials which are exchanged for an access token via the `/hydra-main/login` endpoint.

## Usage (URL-based)
The CLI requires an API URL via `--url`. Use `-u` / `-p` (or `--username` / `--password`) for credentials.

```bash
npm start -- start --url https://api.hexcore.io.vn -u yourusername -p yourpassword
```

**Parameters:**
- `--url <url>`: API server URL (required)
- `-u, --username <username>`: Username for authentication (optional)
- `-p, --password <password>`: Password for authentication (optional; shorthand for `--password`)

**Examples:**
```bash
# With authentication
npm start -- start --url https://alpha-v1.hexcore.io.vn -u username -p password123

# Without authentication (useful for local open APIs)
npm start -- start --url http://localhost:3013
```

## Authentication Flow
1. **Credentials Provided**: User supplies `-u`/`-p` on the CLI (or uses environment / interactive prompt in future enhancements).
2. **Login Request**: Client sends `POST /hydra-main/login` with `{ username, password }`.
3. **Token Response**: Server responds with an access token inside the response payload.
4. **Token Storage**: Token is kept in memory for the session.
5. **Token Injection**: Token is automatically injected as `Authorization: Bearer <token>` on subsequent requests.

## Implementation Details
**Location:** `src/api/client.ts`

- `ApiConfig` supports `url`, optional `username` and `password`.
- `login()` performs `POST /hydra-main/login` and stores the access token.
- The Axios client has a request interceptor that injects the `Authorization` header when a token exists.
- A response helper normalizes responses (the client commonly returns `response.data`).
- Default request timeout is 60 seconds.

## Error Handling
- Common errors surfaced to users include:
  - `Cannot connect to <url>` (connection refused)
  - `Host not found: <url>` (DNS/host error)
  - `Operation timed out (60s)`
  - `Invalid credentials` (HTTP 401)
  - `Access denied` (HTTP 403)
- Login failures cause the CLI to exit before the dashboard starts.

## Security Considerations
- **Don't pass secrets on the command line in production.** Process arguments are visible to other users on the same machine.
- Recommended alternatives:
  - Use environment variables
  - Use an interactive password prompt (planned)
  - Use API tokens or an external secrets manager

## Examples
```bash
# Production with auth
npm start -- start --url https://api.hexcore.io.vn -u operator1 -p SecurePassword123!

# Local dev (no auth)
npm start -- start --url http://localhost:3013
```

## Future Enhancements
- Interactive password prompts (hidden input)
- Environment variable support for credentials
- Token refresh mechanism for long-running sessions
- API key/token based authentication
- Session persistence across CLI invocations
