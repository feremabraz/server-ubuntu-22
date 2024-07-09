#!/usr/bin/env node

import { exec } from "node:child_process";
import fs from "node:fs/promises";
import util from "node:util";
import { confirm, intro, outro, text } from "@clack/prompts";
import color from "picocolors";

const execAsync = util.promisify(exec);

async function runCommand(command) {
	const { stdout, stderr } = await execAsync(command);
	console.log(stdout);
	if (stderr) console.error(color.yellow(stderr));
}

async function editFile(filePath, searchValue, replaceValue) {
	let content = await fs.readFile(filePath, "utf8");
	content = content.replace(searchValue, replaceValue);
	await fs.writeFile(filePath, content, "utf8");
}

async function appendToFile(filePath, content) {
	await fs.appendFile(filePath, content, "utf8");
}

async function main() {
	intro(color.inverse(" Enhanced Ubuntu 22.04 Server Hardening Tool "));

	// Initial Setup
	await runCommand("sudo apt update && sudo apt upgrade -y");
	await runCommand("sudo apt install unattended-upgrades");
	await runCommand("sudo dpkg-reconfigure --priority=low unattended-upgrades");

	// Configure automatic security updates
	await runCommand("sudo apt install apt-listchanges");
	await editFile(
		"/etc/apt/apt.conf.d/50unattended-upgrades",
		'//      "${distro_id}:${distro_codename}-security";',
		'        "${distro_id}:${distro_codename}-security";',
	);

	// Create Non-Root User
	const username = await text({
		message: "Enter the new username:",
		validate: (value) =>
			value.length === 0 ? "Username is required" : undefined,
	});
	await runCommand(`sudo adduser ${username}`);
	await runCommand(`sudo usermod -aG sudo ${username}`);

	// Secure SSH
	await editFile(
		"/etc/ssh/sshd_config",
		"PermitRootLogin yes",
		"PermitRootLogin no",
	);
	await editFile(
		"/etc/ssh/sshd_config",
		"PasswordAuthentication yes",
		"PasswordAuthentication no",
	);
	await appendToFile("/etc/ssh/sshd_config", "PubkeyAuthentication yes\n");
	const newSSHPort = await text({
		message: "Enter new SSH port:",
		validate: (value) =>
			Number.isNaN(Number(value)) ? "Port must be a number" : undefined,
	});
	await editFile("/etc/ssh/sshd_config", "Port 22", `Port ${newSSHPort}`);
	await runCommand("sudo systemctl restart sshd");

	// Configure UFW with rate limiting
	await runCommand("sudo ufw default deny incoming");
	await runCommand("sudo ufw default allow outgoing");
	await runCommand(`sudo ufw limit ${newSSHPort}/tcp comment 'SSH port'`);
	await runCommand("sudo ufw enable");

	// Install and Configure Fail2Ban
	await runCommand("sudo apt install fail2ban");
	await runCommand("sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local");
	await appendToFile(
		"/etc/fail2ban/jail.local",
		`
[sshd]
enabled = true
port = ${newSSHPort}
maxretry = 3
bantime = 86400

[http-dos]
enabled = true
port = http,https
filter = http-dos
logpath = /var/log/apache2/access.log
maxretry = 300
findtime = 300
bantime = 600
  `,
	);
	await fs.writeFile(
		"/etc/fail2ban/filter.d/http-dos.conf",
		`
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*
ignoreregex =
  `,
	);
	await runCommand("sudo systemctl restart fail2ban");

	// Disable Unused Services
	const services = [
		"bluetooth.service",
		"cups.service",
		"avahi-daemon.service",
		"rpcbind.service",
	];
	for (const service of services) {
		await runCommand(`sudo systemctl disable ${service}`);
		await runCommand(`sudo systemctl stop ${service}`);
	}

	// Secure Shared Memory
	await appendToFile(
		"/etc/fstab",
		"tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0\n",
	);

	// Configure System-Wide Security Settings
	await appendToFile(
		"/etc/sysctl.conf",
		`
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv6.conf.all.disable_ipv6 = 1
kernel.randomize_va_space = 2
  `,
	);
	await runCommand("sudo sysctl -p");

	// Install and Configure AppArmor
	await runCommand("sudo apt install apparmor apparmor-utils");
	await runCommand("sudo aa-enforce /etc/apparmor.d/*");

	// Install and Configure Auditd
	await runCommand("sudo apt install auditd");
	await runCommand("sudo systemctl enable auditd");
	await runCommand("sudo systemctl start auditd");

	// Implement Strong Password Policies
	await runCommand("sudo apt install libpam-pwquality");
	await appendToFile(
		"/etc/security/pwquality.conf",
		`
minlen = 14
dcredit = -1
ucredit = -1
ocredit = -1
lcredit = -1
  `,
	);

	// Implement File System Integrity Checking
	await runCommand("sudo apt install aide");
	await runCommand("sudo aideinit");
	await runCommand("sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db");

	// Disable Core Dumps
	await appendToFile("/etc/security/limits.conf", "* hard core 0\n");

	// Restrict Access to Compiler Tools
	await runCommand("sudo apt-get remove gcc make");

	// Secure /tmp Directory
	await runCommand("sudo mount -o remount,noexec,nosuid,nodev /tmp");
	await appendToFile(
		"/etc/fstab",
		"tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0\n",
	);

	// Enable Process Accounting
	await runCommand("sudo apt install acct");
	await runCommand("sudo /etc/init.d/acct start");

	// Install and Configure CrowdSec
	await runCommand(
		"curl -s https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh | sudo bash",
	);
	await runCommand("sudo apt-get install crowdsec");
	await runCommand("sudo systemctl start crowdsec");
	await runCommand("sudo apt-get install crowdsec-firewall-bouncer-iptables");

	// Configure iptables for SYN Flood Protection
	await runCommand(
		"sudo iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT",
	);
	await runCommand("sudo iptables -A INPUT -p tcp --syn -j DROP");

	// Secure GRUB bootloader
	await runCommand("sudo grub-mkpasswd-pbkdf2");
	await appendToFile(
		"/etc/grub.d/40_custom",
		`
set superusers="grubadmin"
password_pbkdf2 grubadmin <generated-password-hash>
  `,
	);
	await runCommand("sudo update-grub");

	// Secure /proc filesystem
	await appendToFile("/etc/fstab", "proc /proc proc defaults,hidepid=2 0 0\n");

	// Install and configure NIDS (Suricata)
	await runCommand("sudo add-apt-repository ppa:oisf/suricata-stable");
	await runCommand("sudo apt update");
	await runCommand("sudo apt install suricata");
	await runCommand("sudo suricata-update");

	// Enable secure logging
	await runCommand("sudo apt install rsyslog");
	await appendToFile(
		"/etc/rsyslog.conf",
		`
$FileCreateMode 0640
*.* @@remote-log-server:514
  `,
	);
	await runCommand("sudo systemctl restart rsyslog");

	// Disable unnecessary kernel modules
	const modulesToDisable = [
		"cramfs",
		"freevxfs",
		"jffs2",
		"hfs",
		"hfsplus",
		"squashfs",
		"udf",
	];
	for (const module of modulesToDisable) {
		await appendToFile(
			"/etc/modprobe.d/disablemodules.conf",
			`install ${module} /bin/false\n`,
		);
	}

	outro(
		color.green("Enhanced server hardening completed. You should reboot now."),
	);
}

main().catch((err) => {
	console.error(color.red("An unexpected error has occurred:"), err);
	process.exit(1);
});
