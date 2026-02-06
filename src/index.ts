#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';
import { SafeNestClient } from '@safenest/sdk';

const config = new Conf({ projectName: 'safenest' });
const VERSION = '1.0.0';

function getClient(): SafeNestClient {
  const apiKey = config.get('apiKey') as string;
  if (!apiKey) {
    console.error(chalk.red('Not logged in. Run: safenest login <api-key>'));
    process.exit(1);
  }
  return new SafeNestClient(apiKey);
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
  .name('safenest')
  .description('SafeNest CLI - AI-powered child safety analysis')
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
      console.log(chalk.dim('Run: safenest login <api-key>'));
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

program.parse();
