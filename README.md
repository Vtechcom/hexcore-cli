# hexcore-cli

**Terminal UI for managing Hydra Nodes** - A blessed-based Node.js CLI application for system operators to manage Hydra Node infrastructure in real-time.

## 🎯 Features

✅ **Interactive Terminal Dashboard** - Real-time system overview with sidebar menu navigation
✅ **Head Management** - Create, list, stop, and inspect Hydra heads
✅ **Account Management** - Add and manage wallet accounts with BIP39 validation
✅ **Node Monitoring** - View all nodes and system health status
✅ **Error Handling** - Graceful error recovery with timeout management
✅ **Real-time Updates** - Background status poll every 5s and full dashboard refresh every 30s for smooth updates
✅ **Keyboard Navigation** - Arrow keys, Enter, Space for intuitive interactions

## 📦 Installation

```bash
npm install
npm run build
```

## 🚀 Usage

### Start Interactive Dashboard

```bash
npm start -- start --url https://api.hexcore.io.vn -u admin -p password123
```

Or using the compiled binary:

```bash
hexcore-cli start --url https://api.hexcore.io.vn -u admin -p password123
```

### Dashboard Features

```
┌──────────────────────────────────────────────────┐
│ hexcore-cli - Hydra Node Manager                 │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📊 OVERVIEW                                      │
│ Running Nodes: 1 | Running Heads: 3 | Total: 5 │
│                                                  │
├──────────────────────────────────────────────────┤
│ 📋 QUICK ACTIONS                                 │
│ [1] Create New Head                              │
│ [2] View All Heads                               │
│ [3] Stop Head                                    │
│ [4] Wallet Accounts                              │
│ [5] Nodes List                                   │
│ [6] Health Status                                │
│                                                  │
│ Enter selection (1-6): _                         │
│                                                  │
├──────────────────────────────────────────────────┤
│ ✓ All systems operational | Last update: 2s ago │
└──────────────────────────────────────────────────┘
```

### Command Line Commands

#### Head Management

```bash
# Create a new Hydra head
hexcore-cli head create --host localhost --port 3013 --accounts account-1,account-2

# List all Hydra heads
hexcore-cli head list --host localhost --port 3013

# Stop a specific head
hexcore-cli head stop head-123 --host localhost --port 3013 --force

# Get head information
hexcore-cli head info head-123 --host localhost --port 3013
```

#### Account Management

```bash
# Add a new wallet account
hexcore-cli account add --host localhost --port 3013 --mnemonic "word1 word2 ... word12"

# List all accounts
hexcore-cli account list --host localhost --port 3013
```

#### Node & Status

```bash
# List all nodes
hexcore-cli node list --host localhost --port 3013

# Get system health status
hexcore-cli status --host localhost --port 3013
```

## 🎮 Keyboard Navigation

In the interactive dashboard:

| Key | Action |
|-----|--------|
| `1-6` | Quick menu selection |
| `↑` / `↓` | Navigate menu items |
| `Enter` | Select/Confirm |
| `Space` | Multi-select (for accounts) |
| `Escape` | Exit |
| `Ctrl+C` | Graceful shutdown |

## 📁 Project Structure

```
hexcore-cli/
├── src/
│   ├── api/
│   │   └── client.ts          # HTTP API client with error handling
│   ├── commands/
│   │   └── (CLI command handlers)
│   ├── ui/
│   │   └── dashboard.ts       # Blessed-based terminal UI
│   ├── utils/
│   │   └── validators.ts      # BIP39 & formatting utilities
│   └── main.ts                # Entry point with Commander.js
├── tests/
│   ├── api-client.test.ts     # API client unit tests
│   └── validators.test.ts     # Validator utility tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Build and test
npm run build && npm test
```

**Test Coverage:**
- 27/27 tests passing (validators 100%, API integration 100%)
- Core functionality fully tested
- Error handling scenarios covered
- BIP39 mnemonic validation tests

## 🔧 Architecture

### API Client (`src/api/client.ts`)

The `ApiClient` class handles all communication with the Hydra backend API:

- **Timeout Handling**: 60-second default timeout per request
- **Error Recovery**: Specific error messages for different failure scenarios
- **Graceful Degradation**: Partial failures handled with status indicators
- **API Endpoints**:
  - `GET /hydra-main/active-nodes` - List active heads
  - `GET /hydra-main/hydra-node/{id}` - Get head/node details
  - `POST /hydra-main/create-node` - Create new Hydra node/head
  - `POST /hydra-main/hydra-node/{id}/stop` - Stop a head
  - `GET /hydra-main/list-account` - Get all accounts
  - `POST /hydra-main/create-account` - Add new account
  - `GET /hydra-main/hydra-nodes` - List all nodes

### Dashboard UI (`src/ui/dashboard.ts`)

Terminal UI built with blessed library:

- **Real-time Updates**: Background status poll every 5 seconds and full refresh every 30 seconds (reduces UI flicker)
- **Menu System**: Keyboard-driven navigation
- **Status Bar**: Connection and operation status
- **Error Display**: Clear error messages with suggestions
- **Data Views**: List, detail, and input screens

### Validators (`src/utils/validators.ts`)

Utility functions for data validation and formatting:

- `validateBIP39Mnemonic()` - BIP39 phrase validation
- `formatStatus()` - Color-coded status formatting
- `formatTime()` - ISO date to readable format
- `getTimeSinceUpdate()` - Time elapsed formatting
- `truncate()` - String truncation with ellipsis

## 📋 Brainstorming Foundation

This CLI was designed based on comprehensive brainstorming sessions focused on:

- **Operator UX**: Stress-free, time-efficient workflows
- **Real-time Feedback**: Progress indicators and status updates
- **Error Prevention**: Clear messages and graceful degradation
- **Simplicity**: Minimal flags, sensible defaults
- **Speed**: Dashboard loads in <1 second, operations complete in <60 seconds

See [brainstorming-session-2025-12-15.md](../analysis/brainstorming-session-2025-12-15.md) for detailed design rationale.

## 🔌 Configuration

### Required Environment

- Node.js >= 18.0.0
- npm or pnpm package manager
- Hydra backend API accessible at specified host:port

### API Connection

API connections:
- `--url <url>`: Preferred for the interactive dashboard (`start` command requires `--url`).
- `-h, --host <host>` and `-p, --port <port>`: Supported by most individual commands that target a specific server.

No config files needed - explicit specification is required for operations.

## 📊 Status Indicators

- `✓ Green` - Operating normally
- `⚠ Yellow` - Warning/Inactive
- `✗ Red` - Error/Stopped
- Connection status shown in bottom status bar
- Auto-refresh timestamp displayed

## 🚨 Error Handling

The CLI handles various error scenarios gracefully:

| Error | Behavior |
|-------|----------|
| Connection refused | Shows "Connection failed" with retry prompt |
| Host not found | Shows "Host not found" message |
| Operation timeout (60s) | Shows "Operation timed out" with suggestion |
| Invalid BIP39 mnemonic | Shows "Invalid BIP39 phrase" with retry option |
| API 404 error | Shows "Resource not found" message |
| Partial API failure | Shows available data + error status bar |

## 🎯 Development

### Build

```bash
npm run build
```

### Development with ts-node

```bash
npm run dev -- start --url http://localhost:3013
```

### Type Checking

All code is fully typed with TypeScript strict mode enabled.

## 📦 Dependencies

- **blessed** - Terminal UI library
- **commander** - CLI argument parsing
- **axios** - HTTP client
- **bip39** - BIP39 mnemonic validation
- **chalk** - Terminal colors (optional)

## 📝 License

MIT

## 🙋 Support

For issues or feature requests, refer to the project documentation in `/docs`.

---

**Last Updated:** December 15, 2025  
**Status:** Ready for production development  
**Version:** 1.0.0-alpha
