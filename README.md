# Ubuntu 22.04 Server Hardening Tool

This tool automates the process of hardening an Ubuntu 22.04 server based on best security practices.

## Features

- System updates and automatic security upgrades
- Non-root user creation with sudo privileges
- Enhanced SSH security configuration with key-based authentication
- UFW setup with rate limiting
- Fail2Ban installation and advanced configuration
- Comprehensive unused service disabling
- Robust system-wide security settings
- AppArmor and Auditd setup and enforcement
- Strong password policies implementation
- File system integrity checking with AIDE
- Core dump disabling and compiler tools restriction
- Temporary directory and shared memory security
- Process accounting enablement
- CrowdSec installation and configuration against DDoS
- Advanced SYN flood and DDoS protection
- GRUB bootloader security
- /proc filesystem hardening
- Network Intrusion Detection System
- Secure logging configuration
- Unnecessary kernel module disabling

## Development - Prerequisites

- Node.js v22.4.1 or later
- Ubuntu 22.04 or later with root access

## Development - Executable

This script is designed to be packaged as a single executable application using Node.js v22.4.1 'Single executable applications' feature.

### Usage Modes

- **Interactive:**
  ```sh
  pnpm start
  ```
  (You’ll be prompted for username and SSH port.)

- **Non-interactive / Automation:**
  ```sh
  pnpm start --non-interactive --username=myadmin --ssh-port=2222
  # or with env vars:
  USERNAME=myadmin SSH_PORT=2222 pnpm start --non-interactive
  ```

- **Dry-Run Mode:**
  ```sh
  pnpm start --dry-run [other flags]
  # or:
  DRY_RUN=1 pnpm start [other flags]
  ```
  This mode logs all actions but does not make any changes to the system. Useful for reviewing or testing what would happen.

### Rollback & Logging
- If a command fails, the script logs which step failed and what had already been attempted. In dry-run mode, all planned actions are logged.

1. Build the executable: `pnpm install && pnpm build`
2. Make the file executable: `chmod +x ubuntu-hardening-tool`
3. Copy the resulting executable: `scp ubuntu-hardening-tool username@server_ip:`
4. Run it there with root privileges: `sudo ./ubuntu-hardening-tool`

## Development - Releases

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning and changelog management.

**Release Workflow:**
1. **Create a changeset:**
   ```sh
   pnpm exec changeset
   ```
   (Follow the prompts to describe your changes and select the version bump.)
2. **Run the release script:**
   ```sh
   pnpm release
   ```
   This will:
   - Build the executable and generate the checksum
   - Bump the version and update the changelog
   - Commit and tag the release in git
3. **Publish the release to GitHub:**
   ```sh
   pnpm release:publish
   ```
   This pushes your commits and tags to the `main` branch on GitHub, triggering the GitHub Actions workflow that builds your executable and checksum and uploads them as release artifacts.

**Automating GitHub Releases with Artifacts:**
- You can further automate your workflow by using GitHub Actions (or similar CI/CD tools) to:
  - Push your code, tags, and changelog to GitHub
  - Automatically publish a new release on GitHub
  - Attach the built executable and checksum as downloadable release artifacts
- This means that after running `pnpm release` and pushing your changes, users can download pre-built binaries directly from your GitHub Releases page, improving usability and trust.
- If you want to set up this automation, let me know!

## Direct Usage

1. Get the script: `wget https://github.com/feremabraz/server-ubuntu-22/releases/download/vX.Y.Z/ubuntu-hardening-tool` (adjust accordingly)
2. Get the checksum: `wget https://github.com/feremabraz/server-ubuntu-22/releases/download/vX.Y.Z/ubuntu-hardening-tool.sha256`
3. Verify the script's integrity: `sha256sum --check ubuntu-hardening-tool.sha256`
4. Make the file executable: `chmod +x ubuntu-hardening-tool`
5. Run it: `./ubuntu-hardening-tool`
