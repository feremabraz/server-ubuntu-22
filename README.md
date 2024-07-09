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

1. Build the executable: `pnpm install && pnpm build`
2. Make the file executable: `chmod +x ubuntu-hardening-tool`
3. Copy the resulting executable: `scp ubuntu-hardening-tool username@server_ip:`
4. Run it there with root privileges: `sudo ./ubuntu-hardening-tool`

## Development - Releases

`pnpm release` will build the executable, generate the checksum, bump the version, update the changelog, create a new commit with these changes, and create a new tag.

## Direct Usage

1. Get the script: `wget https://github.com/feremabraz/server-ubuntu-22/releases/download/vX.Y.Z/ubuntu-hardening-tool` (adjust accordingly)
2. Get the checksum: `wget https://github.com/feremabraz/server-ubuntu-22/releases/download/vX.Y.Z/ubuntu-hardening-tool.sha256`
3. Verify the script's integrity: `sha256sum --check ubuntu-hardening-tool.sha256`
4. Make the file executable: `chmod +x ubuntu-hardening-tool`
5. Run it: `./ubuntu-hardening-tool`
