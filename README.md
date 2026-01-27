# spec-kit-lab

An introductory laboratory to know how to use GitHub Spec Kit

## About This Lab

This repository provides a hands-on environment for learning and experimenting with GitHub Spec Kit. The development environment comes pre-configured with all necessary tools and dependencies, allowing you to focus on exploring Spec Kit's capabilities without worrying about setup.

### What's Included

**GitHub Spec Kit** is pre-installed and ready to use in this devcontainer. Spec Kit is a powerful tool for working with API specifications, enabling you to:

- Define and manage API specifications
- Generate code from specifications
- Validate API contracts
- Test API endpoints
- Collaborate on API design

Whether you're using GitHub Codespaces or running the devcontainer locally, Spec Kit and all its dependencies are automatically configured when the environment starts. Simply open the container and start exploring!

## Start the Lab by getting Started with the Devcontainer

This project uses a development container (devcontainer) to provide a consistent development environment. You can use it locally with Docker or in the cloud with GitHub Codespaces.

### Step 1: Fork the Repository

Before you begin, fork this repository to your own GitHub account:

1. **Navigate to the repository:**
   - Go to [https://github.com/ENESFERA/spec-kit-lab](https://github.com/ENESFERA/spec-kit-lab)

2. **Fork the repository:**
   - Click the **"Fork"** button in the top-right corner of the page
   - Select your GitHub account as the destination
   - Wait for the fork to complete

3. **Work from your fork:**
   - All subsequent steps should be performed on your forked repository
   - This allows you to make changes and push commits without affecting the original repository

### Step 2: Open the repository to start the lab

#### Option 1: Using GitHub Codespaces (Recommended)

GitHub Codespaces provides a cloud-based development environment with no local setup required.

##### Steps to Start with Codespaces

1. **Navigate to your forked repository:**
   - Go to `https://github.com/YOUR-USERNAME/spec-kit-lab` (replace `YOUR-USERNAME` with your GitHub username)

2. **Create a new Codespace:**
   - Click the green **"Code"** button
   - Select the **"Codespaces"** tab
   - Click **"Create codespace on main"** (or your desired branch)

3. **Wait for the environment to load:**
   - GitHub will automatically build and configure your development environment
   - This typically takes 1-2 minutes
   - Once ready, you'll have a full VS Code environment in your browser

4. **Start developing:**
   - All tools and dependencies are pre-installed
   - Your changes are automatically saved to the cloud
   - You can access your Codespace from any device

##### Benefits of Codespaces

- ✅ No local Docker installation required
- ✅ Consistent environment across all team members
- ✅ Access from any device with a web browser
- ✅ Free tier includes 60 hours/month for personal accounts
- ✅ Automatic environment setup and configuration

#### Option 2: Using Local Devcontainer

##### Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code

##### Starting the Devcontainer

1. **Clone your forked repository:**

   ```bash
   git clone https://github.com/YOUR-USERNAME/spec-kit-lab.git
   cd spec-kit-lab
   ```

2. **Open in VS Code:**

   ```bash
   code .
   ```

3. **Reopen in Container:**
   - VS Code should automatically detect the devcontainer configuration
   - Click on the notification to "Reopen in Container"
   - Or use the Command Palette (`F1` or `Ctrl+Shift+P`) and select **"Dev Containers: Reopen in Container"**

4. **Wait for the container to build:**
   - The first time you open the project, Docker will build the container image
   - This may take a few minutes depending on your internet connection
   - Subsequent starts will be much faster

5. **Start developing:**
   - Once the container is ready, you'll have a fully configured development environment
   - The container runs Ubuntu 24.04.3 LTS with pre-installed tools

#### Available Tools

The devcontainer includes the following command-line tools:

- Package management: `apt`, `dpkg`
- Container tools: `docker`
- Version control: `git`, `gh` (GitHub CLI)
- Kubernetes: `kubectl`
- Networking: `curl`, `wget`, `ssh`, `scp`, `rsync`, `netstat`, `lsof`
- System utilities: `ps`, `top`, `tree`, `find`, `grep`
- Compression: `zip`, `unzip`, `tar`, `gzip`, `bzip2`, `xz`
- Security: `gpg`

#### Troubleshooting

- **Container won't start:** Make sure Docker is running and you have sufficient resources allocated
- **Port conflicts:** Check if any required ports are already in use on your host machine
- **Permission issues:** Ensure your user has permission to run Docker commands

### Step 3: Open THEGAME.md to Start the Lab

Once your development environment is ready (either in Codespaces or local devcontainer):

1. **Open the game file:**
   - Navigate to [THEGAME.md](THEGAME.md) in the repository root
   - Or use the VS Code file explorer to locate and open `THEGAME.md`

2. **Follow the instructions:**
   - THEGAME.md contains the interactive lab experience
   - Follow the steps and challenges presented in the file
   - Complete each task as you progress through the lab

3. **Have fun learning!**
   - The lab is designed to be engaging and educational
   - Don't hesitate to experiment and explore

## Model Context Protocol (MCP) Configuration

This workspace includes a pre-configured [`.vscode/mcp.json`](.vscode/mcp.json) file that enables GitHub Copilot to access powerful external tools through the Model Context Protocol (MCP). MCP allows AI assistants to interact with various services and tools to provide enhanced capabilities.

### Registered MCP Servers

The following MCP servers are configured and ready to use:

#### Development Tools

- **context7** (`@upstash/context7-mcp`)
  - Retrieves up-to-date documentation and code examples for programming libraries and frameworks
  - Helps with library-specific questions and implementation patterns

- **shadcn** (`shadcn@latest mcp`)
  - Access to shadcn/ui components and registry
  - Facilitates UI component development and integration

#### Browser Automation

- **playwright** (`@playwright/mcp`)
  - Browser automation and testing capabilities
  - Enables web scraping, testing, and interaction with web applications

- **concurrent-browser** (`concurrent-browser-mcp`)
  - Manages multiple browser instances simultaneously (up to 20 instances)
  - Useful for parallel browser testing and automation tasks

#### Advanced Capabilities

- **sequentialthinking** (Docker-based)
  - Provides structured reasoning and problem-solving capabilities
  - Helps break down complex tasks into logical steps

#### Integration Services

- **github-mcp** (HTTP)
  - Direct integration with GitHub APIs
  - Access to repository data, issues, pull requests, and more

- **microsoft-learn** (HTTP)
  - Access to Microsoft Learn documentation
  - Official Microsoft technical documentation and learning resources

### How It Works

When you use GitHub Copilot in this workspace, it can automatically access these MCP servers to:

- Fetch real-time documentation
- Automate browser interactions
- Access GitHub data
- Retrieve technical documentation
- Perform complex reasoning tasks

No additional configuration is needed—just start using Copilot and it will leverage these tools when appropriate!

---

## Dice Rolling Engine Project

This repository includes a complete implementation of a **Dice Rolling Engine** - a high-performance, production-ready dice rolling API built with ASP.NET Core 10.

### Features

- **Standard Dice Notation**: Roll any combination of dice (e.g., `2d6`, `1d20+5`, `3d8-2`)
- **Complex Expressions**: Combine multiple dice groups (`2d6+1d4+3`, `1d8+2d6+5`)
- **Advantage/Disadvantage**: D&D 5e-style mechanics (`1d20a` for advantage, `1d20d` for disadvantage)
- **Cryptographic Security**: Uses `System.Security.Cryptography.RandomNumberGenerator` for truly random results
- **High Performance**: Sub-50ms response times for all operations
- **Validation Endpoint**: Validate expressions without rolling
- **Statistical Analysis**: Calculate min/max/mean/standard deviation
- **OpenAPI/Swagger**: Full API documentation with interactive UI
- **Comprehensive Testing**: 76+ tests with code coverage

### Quick Start

\`\`\`bash
# Build the solution
dotnet build

# Run the API
dotnet run --project src/DiceEngine.API

# Navigate to http://localhost:5000 for Swagger UI

# Run tests
dotnet test
\`\`\`

### API Example

\`\`\`bash
# Roll 2d6+3
curl -X POST http://localhost:5000/api/roll \\
  -H "Content-Type: application/json" \\
  -d '{"expression":"2d6+3"}'

# Validate expression
curl -X POST http://localhost:5000/api/roll/validate \\
  -H "Content-Type: application/json" \\
  -d '{"expression":"2d6+1d4+3"}'

# Get statistics
curl http://localhost:5000/api/roll/stats/2d6
\`\`\`

### Project Structure

\`\`\`
src/
├── DiceEngine.API/              # ASP.NET Core Web API
├── DiceEngine.Application/      # Business Logic Layer
├── DiceEngine.Domain/           # Domain Layer (Core)
└── DiceEngine.Infrastructure/   # Infrastructure Layer

tests/
├── DiceEngine.API.Tests/        # API integration tests
└── DiceEngine.Application.Tests/ # Unit tests (62 tests)

specs/
└── 001-dice-engine/            # Feature specification & planning docs
\`\`\`

### Supported Notation

- **Basic**: `2d6`, `1d20+5`, `3d8-2`
- **Complex**: `2d6+1d4+3`, `1d8+2d6+5`
- **Advantage**: `1d20a` (roll twice, take higher)
- **Disadvantage**: `1d20d` (roll twice, take lower)

**Limits**: 1-1000 dice per roll, 1-1000 sides per die

For detailed documentation, see [\`specs/001-dice-engine/\`](specs/001-dice-engine/).
