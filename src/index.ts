#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';
import { TuteliqClient } from '@tuteliq/sdk';

const config = new Conf({ projectName: 'tuteliq' });
const VERSION = '1.1.0';

function getClient(): TuteliqClient {
  const apiKey = config.get('apiKey') as string;
  if (!apiKey) {
    console.error(chalk.red('Not logged in. Run: tuteliq login <api-key>'));
    process.exit(1);
  }
  return new TuteliqClient(apiKey);
}

function formatSeverity(severity: string): string {
  const colors: Record<string, (s: string) => string> = {
    low: chalk.yellow,
    medium: chalk.hex('#FFA500'),
    high: chalk.red,
    critical: chalk.bgRed.white,
  };
  return (colors[severity] || chalk.white)(severity.toUpperCase());
}

function formatRisk(risk: string): string {
  const colors: Record<string, (s: string) => string> = {
    none: chalk.green,
    safe: chalk.green,
    low: chalk.yellow,
    medium: chalk.hex('#FFA500'),
    high: chalk.red,
    critical: chalk.bgRed.white,
  };
  return (colors[risk] || chalk.white)(risk.toUpperCase());
}

const program = new Command();

program
  .name('tuteliq')
  .description('Tuteliq CLI - AI-powered child safety analysis')
  .version(VERSION);

// Login command
program
  .command('login <api-key>')
  .description('Save your API key')
  .action((apiKey: string) => {
    config.set('apiKey', apiKey);
    console.log(chalk.green('✓ API key saved successfully!'));
    console.log(chalk.dim('Your key is stored locally at: ' + config.path));
  });

// Logout command
program
  .command('logout')
  .description('Remove saved API key')
  .action(() => {
    config.delete('apiKey');
    console.log(chalk.green('✓ Logged out successfully!'));
  });

// Whoami command
program
  .command('whoami')
  .description('Show current login status')
  .action(() => {
    const apiKey = config.get('apiKey') as string;
    if (apiKey) {
      const masked = apiKey.slice(0, 8) + '...' + apiKey.slice(-4);
      console.log(chalk.green('✓ Logged in'));
      console.log(chalk.dim('API Key: ' + masked));
    } else {
      console.log(chalk.yellow('Not logged in'));
      console.log(chalk.dim('Run: tuteliq login <api-key>'));
    }
  });

// Detect bullying
program
  .command('detect-bullying <text>')
  .alias('bullying')
  .description('Analyze text for bullying or harassment')
  .action(async (text: string) => {
    const spinner = ora('Analyzing...').start();
    try {
      const client = getClient();
      const result = await client.detectBullying({ content: text });
      spinner.stop();

      console.log();
      if (result.is_bullying) {
        console.log(chalk.red.bold('⚠ BULLYING DETECTED'));
      } else {
        console.log(chalk.green.bold('✓ No bullying detected'));
      }
      console.log();
      console.log(`Severity:    ${formatSeverity(result.severity)}`);
      console.log(`Confidence:  ${chalk.cyan((result.confidence * 100).toFixed(0) + '%')}`);
      console.log(`Risk Score:  ${chalk.cyan((result.risk_score * 100).toFixed(0) + '%')}`);
      if (result.bullying_type?.length > 0) {
        console.log(`Types:       ${result.bullying_type.join(', ')}`);
      }
      console.log();
      console.log(chalk.dim('Rationale:'));
      console.log(result.rationale);
      console.log();
      console.log(`Action: ${chalk.yellow(result.recommended_action)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Detect grooming
program
  .command('detect-grooming')
  .alias('grooming')
  .description('Analyze conversation for grooming patterns')
  .requiredOption('-m, --messages <json>', 'Messages as JSON array: [{"role":"adult","content":"..."}]')
  .option('-a, --age <number>', 'Child age')
  .action(async (options) => {
    const spinner = ora('Analyzing...').start();
    try {
      const client = getClient();
      const messages = JSON.parse(options.messages);
      const result = await client.detectGrooming({
        messages,
        childAge: options.age ? parseInt(options.age) : undefined,
      });
      spinner.stop();

      console.log();
      if (result.grooming_risk !== 'none') {
        console.log(chalk.red.bold('⚠ GROOMING RISK DETECTED'));
      } else {
        console.log(chalk.green.bold('✓ No grooming detected'));
      }
      console.log();
      console.log(`Risk Level:  ${formatRisk(result.grooming_risk)}`);
      console.log(`Confidence:  ${chalk.cyan((result.confidence * 100).toFixed(0) + '%')}`);
      console.log(`Risk Score:  ${chalk.cyan((result.risk_score * 100).toFixed(0) + '%')}`);
      if (result.flags?.length > 0) {
        console.log();
        console.log(chalk.dim('Warning Flags:'));
        result.flags.forEach((flag: string) => console.log(chalk.yellow(`  • ${flag}`)));
      }
      console.log();
      console.log(chalk.dim('Rationale:'));
      console.log(result.rationale);
      console.log();
      console.log(`Action: ${chalk.yellow(result.recommended_action)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Detect unsafe content
program
  .command('detect-unsafe <text>')
  .alias('unsafe')
  .description('Detect self-harm, violence, or other unsafe content')
  .action(async (text: string) => {
    const spinner = ora('Analyzing...').start();
    try {
      const client = getClient();
      const result = await client.detectUnsafe({ content: text });
      spinner.stop();

      console.log();
      if (result.unsafe) {
        console.log(chalk.red.bold('⚠ UNSAFE CONTENT DETECTED'));
      } else {
        console.log(chalk.green.bold('✓ Content is safe'));
      }
      console.log();
      console.log(`Severity:    ${formatSeverity(result.severity)}`);
      console.log(`Confidence:  ${chalk.cyan((result.confidence * 100).toFixed(0) + '%')}`);
      console.log(`Risk Score:  ${chalk.cyan((result.risk_score * 100).toFixed(0) + '%')}`);
      if (result.categories?.length > 0) {
        console.log(`Categories:  ${result.categories.join(', ')}`);
      }
      console.log();
      console.log(chalk.dim('Rationale:'));
      console.log(result.rationale);
      console.log();
      console.log(`Action: ${chalk.yellow(result.recommended_action)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Quick analyze
program
  .command('analyze <text>')
  .description('Quick safety analysis (bullying + unsafe)')
  .action(async (text: string) => {
    const spinner = ora('Analyzing...').start();
    try {
      const client = getClient();
      const result = await client.analyze({ content: text });
      spinner.stop();

      console.log();
      if (result.risk_level === 'safe') {
        console.log(chalk.green.bold('✓ Content appears safe'));
      } else {
        console.log(chalk.red.bold('⚠ SAFETY CONCERNS DETECTED'));
      }
      console.log();
      console.log(`Risk Level:  ${formatRisk(result.risk_level)}`);
      console.log(`Risk Score:  ${chalk.cyan((result.risk_score * 100).toFixed(0) + '%')}`);
      console.log();
      console.log(chalk.dim('Summary:'));
      console.log(result.summary);
      console.log();
      console.log(`Action: ${chalk.yellow(result.recommended_action)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Analyze emotions
program
  .command('emotions <text>')
  .description('Analyze emotional content')
  .action(async (text: string) => {
    const spinner = ora('Analyzing...').start();
    try {
      const client = getClient();
      const result = await client.analyzeEmotions({ content: text });
      spinner.stop();

      const trendEmoji: Record<string, string> = {
        improving: '📈',
        stable: '➡️',
        worsening: '📉',
      };

      console.log();
      console.log(chalk.bold('Emotion Analysis'));
      console.log();
      console.log(`Dominant:  ${chalk.cyan(result.dominant_emotions.join(', '))}`);
      console.log(`Trend:     ${trendEmoji[result.trend] || ''} ${result.trend}`);
      console.log();
      console.log(chalk.dim('Summary:'));
      console.log(result.summary);
      console.log();
      console.log(chalk.dim('Recommended Follow-up:'));
      console.log(result.recommended_followup);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Get action plan
program
  .command('action-plan <situation>')
  .alias('plan')
  .description('Get guidance for handling a situation')
  .option('-a, --age <number>', 'Child age')
  .option('-t, --audience <type>', 'Audience: child, parent, educator, platform', 'parent')
  .option('-s, --severity <level>', 'Severity: low, medium, high, critical')
  .action(async (situation: string, options) => {
    const spinner = ora('Generating action plan...').start();
    try {
      const client = getClient();
      const result = await client.getActionPlan({
        situation,
        childAge: options.age ? parseInt(options.age) : undefined,
        audience: options.audience,
        severity: options.severity,
      });
      spinner.stop();

      console.log();
      console.log(chalk.bold('Action Plan'));
      console.log(chalk.dim(`For: ${result.audience} | Tone: ${result.tone}`));
      console.log();
      console.log(chalk.dim('Steps:'));
      result.steps.forEach((step: string, i: number) => {
        console.log(chalk.cyan(`  ${i + 1}. `) + step);
      });
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Account management (GDPR)
const account = program
  .command('account')
  .description('Account data management (GDPR compliance)');

account
  .command('delete')
  .description('Delete all account data (GDPR Article 17 — Right to Erasure)')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    if (!options.confirm) {
      console.log(chalk.red.bold('⚠ WARNING: This will permanently delete ALL your account data.'));
      console.log(chalk.dim('Run with --confirm to proceed.'));
      process.exit(0);
    }

    const spinner = ora('Deleting account data...').start();
    try {
      const client = getClient();
      const result = await client.deleteAccountData();
      spinner.stop();

      console.log();
      console.log(chalk.green.bold('✓ Account data deleted'));
      console.log(`Deleted records: ${chalk.cyan(String(result.deleted_count))}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

account
  .command('export')
  .description('Export all account data as JSON (GDPR Article 20 — Right to Data Portability)')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .action(async (options) => {
    const spinner = ora('Exporting account data...').start();
    try {
      const client = getClient();
      const result = await client.exportAccountData();
      spinner.stop();

      const json = JSON.stringify(result, null, 2);

      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, json);
        console.log(chalk.green.bold('✓ Data exported to ' + options.output));
      } else {
        console.log(json);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

account
  .command('consent-record')
  .description('Record consent (GDPR Article 7)')
  .requiredOption('-t, --type <type>', 'Consent type (data_processing, analytics, marketing, third_party_sharing, child_safety_monitoring)')
  .requiredOption('-v, --version <version>', 'Policy version')
  .action(async (options) => {
    const spinner = ora('Recording consent...').start();
    try {
      const client = getClient();
      const result = await client.recordConsent({
        consent_type: options.type,
        version: options.version,
      });
      spinner.stop();

      console.log();
      console.log(chalk.green.bold('✓ Consent recorded'));
      console.log(`Type: ${chalk.cyan(result.consent.consent_type)}`);
      console.log(`Status: ${chalk.cyan(result.consent.status)}`);
      console.log(`Version: ${chalk.cyan(result.consent.version)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

account
  .command('consent-status')
  .description('Get consent status (GDPR Article 7)')
  .option('-t, --type <type>', 'Filter by consent type')
  .action(async (options) => {
    const spinner = ora('Fetching consent status...').start();
    try {
      const client = getClient();
      const result = await client.getConsentStatus(options.type);
      spinner.stop();

      if (result.consents.length === 0) {
        console.log(chalk.dim('No consent records found.'));
        return;
      }

      console.log();
      for (const consent of result.consents) {
        const statusColor = consent.status === 'granted' ? chalk.green : chalk.red;
        console.log(`${chalk.bold(consent.consent_type)}: ${statusColor(consent.status)} (v${consent.version})`);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

account
  .command('consent-withdraw')
  .description('Withdraw consent (GDPR Article 7.3)')
  .requiredOption('-t, --type <type>', 'Consent type to withdraw')
  .action(async (options) => {
    const spinner = ora('Withdrawing consent...').start();
    try {
      const client = getClient();
      const result = await client.withdrawConsent(options.type);
      spinner.stop();

      console.log();
      console.log(chalk.yellow.bold('✓ Consent withdrawn'));
      console.log(`Type: ${chalk.cyan(result.consent.consent_type)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

account
  .command('audit-logs')
  .description('Get audit trail (GDPR Article 15)')
  .option('-a, --action <action>', 'Filter by action type')
  .option('-l, --limit <limit>', 'Maximum number of results')
  .action(async (options) => {
    const spinner = ora('Fetching audit logs...').start();
    try {
      const client = getClient();
      const result = await client.getAuditLogs({
        action: options.action,
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
      });
      spinner.stop();

      if (result.audit_logs.length === 0) {
        console.log(chalk.dim('No audit logs found.'));
        return;
      }

      console.log();
      for (const log of result.audit_logs) {
        console.log(`${chalk.dim(log.created_at)} ${chalk.bold(log.action)} ${chalk.dim(`(${log.id})`)}`);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Breach management
const breach = program
  .command('breach')
  .description('Data breach management (GDPR Article 33/34)');

breach
  .command('log')
  .description('Log a new data breach')
  .requiredOption('-t, --title <title>', 'Breach title')
  .requiredOption('-d, --description <description>', 'Breach description')
  .requiredOption('-s, --severity <severity>', 'Severity: low, medium, high, critical')
  .requiredOption('-u, --users <ids>', 'Affected user IDs (comma-separated)')
  .requiredOption('-c, --categories <categories>', 'Data categories (comma-separated)')
  .requiredOption('-r, --reported-by <reporter>', 'Who reported the breach')
  .action(async (options) => {
    const spinner = ora('Logging breach...').start();
    try {
      const client = getClient();
      const result = await client.logBreach({
        title: options.title,
        description: options.description,
        severity: options.severity,
        affected_user_ids: options.users.split(',').map((s: string) => s.trim()),
        data_categories: options.categories.split(',').map((s: string) => s.trim()),
        reported_by: options.reportedBy,
      });
      spinner.stop();

      console.log();
      console.log(chalk.red.bold('⚠ Breach logged'));
      console.log(`ID:       ${chalk.cyan(result.breach.id)}`);
      console.log(`Title:    ${result.breach.title}`);
      console.log(`Severity: ${formatSeverity(result.breach.severity)}`);
      console.log(`Status:   ${chalk.yellow(result.breach.status)}`);
      console.log(`Deadline: ${chalk.dim(result.breach.notification_deadline)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

breach
  .command('list')
  .description('List data breaches')
  .option('-s, --status <status>', 'Filter by status: detected, investigating, contained, reported, resolved')
  .option('-l, --limit <limit>', 'Maximum number of results')
  .action(async (options) => {
    const spinner = ora('Fetching breaches...').start();
    try {
      const client = getClient();
      const result = await client.listBreaches({
        status: options.status,
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
      });
      spinner.stop();

      if (result.breaches.length === 0) {
        console.log(chalk.dim('No breaches found.'));
        return;
      }

      console.log();
      for (const b of result.breaches) {
        console.log(`${formatSeverity(b.severity)} ${chalk.bold(b.title)} ${chalk.dim(`(${b.id})`)}`);
        console.log(`  Status: ${chalk.yellow(b.status)} | Notification: ${chalk.yellow(b.notification_status)} | ${chalk.dim(b.created_at)}`);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

breach
  .command('get <id>')
  .description('Get a single breach by ID')
  .action(async (id: string) => {
    const spinner = ora('Fetching breach...').start();
    try {
      const client = getClient();
      const result = await client.getBreach(id);
      spinner.stop();

      const b = result.breach;
      console.log();
      console.log(chalk.bold(b.title));
      console.log();
      console.log(`ID:            ${chalk.cyan(b.id)}`);
      console.log(`Severity:      ${formatSeverity(b.severity)}`);
      console.log(`Status:        ${chalk.yellow(b.status)}`);
      console.log(`Notification:  ${chalk.yellow(b.notification_status)}`);
      console.log(`Reported By:   ${b.reported_by}`);
      console.log(`Deadline:      ${chalk.dim(b.notification_deadline)}`);
      console.log(`Created:       ${chalk.dim(b.created_at)}`);
      console.log(`Updated:       ${chalk.dim(b.updated_at)}`);
      console.log();
      console.log(chalk.dim('Description:'));
      console.log(b.description);
      console.log();
      console.log(`Affected Users:   ${b.affected_user_ids.join(', ')}`);
      console.log(`Data Categories:  ${b.data_categories.join(', ')}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

breach
  .command('update <id>')
  .description('Update a breach status')
  .requiredOption('-s, --status <status>', 'New status: detected, investigating, contained, reported, resolved')
  .option('-n, --notification <status>', 'Notification status: pending, users_notified, dpa_notified, completed')
  .option('--notes <notes>', 'Additional notes')
  .action(async (id: string, options) => {
    const spinner = ora('Updating breach...').start();
    try {
      const client = getClient();
      const result = await client.updateBreachStatus(id, {
        status: options.status,
        notification_status: options.notification,
        notes: options.notes,
      });
      spinner.stop();

      console.log();
      console.log(chalk.green.bold('✓ Breach updated'));
      console.log(`Status:        ${chalk.yellow(result.breach.status)}`);
      console.log(`Notification:  ${chalk.yellow(result.breach.notification_status)}`);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
