/**
 * Centralized logging utility for the Site Survey Tool
 * 
 * This logger provides environment-aware logging that:
 * - Only logs debug/info messages in development
 * - Always logs warnings and errors (for production error tracking)
 * - Provides consistent formatting with prefixes
 * - Can be easily integrated with external monitoring services (Sentry, LogRocket, etc.)
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.debug('User clicked button', { userId: '123' });
 * logger.info('Project synced successfully');
 * logger.warn('Slow network detected');
 * logger.error('Failed to upload photo', error);
 * ```
 */

import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Logger utility with environment-aware log levels
 */
export const logger = {
    /**
     * Debug-level logging (development only)
     * Use for detailed debugging information that helps during development
     * Will NOT appear in production builds
     * 
     * @param message - The debug message
     * @param data - Optional additional data to log
     */
    debug: (message: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            console.log(`[DEBUG] ${message}`, ...data);
        }
    },

    /**
     * Info-level logging (development only)
     * Use for general informational messages about app state
     * Will NOT appear in production builds
     * 
     * @param message - The info message
     * @param data - Optional additional data to log
     */
    info: (message: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            console.info(`[INFO] ${message}`, ...data);
        }
    },

    /**
     * Warning-level logging (all environments)
     * Use for potentially harmful situations that should be investigated
     * Will appear in both development and production
     * 
     * @param message - The warning message
     * @param data - Optional additional data to log
     */
    warn: (message: string, ...data: unknown[]) => {
        console.warn(`[WARN] ${message}`, ...data);
        Sentry.captureMessage(message, {
            level: "warning",
            extra: { data }
        });
    },

    /**
     * Error-level logging (all environments)
     * Use for error conditions that need immediate attention
     * Will appear in both development and production
     * 
     * @param message - The error message
     * @param error - The error object or additional data
     */
    error: (message: string, error?: unknown, ...data: unknown[]) => {
        console.error(`[ERROR] ${message}`, error, ...data);
        Sentry.captureException(error instanceof Error ? error : new Error(message), {
            extra: { message, data }
        });
    },

    /**
     * Sync-specific logging (development only)
     * Use for logging sync operations with Google Drive
     * Automatically prefixes with [sync] for easy filtering
     * 
     * @param message - The sync message
     * @param projectId - The project ID being synced
     * @param data - Optional additional data to log
     */
    sync: (message: string, projectId?: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            const prefix = projectId ? `[sync:${projectId}]` : '[sync]';
            console.log(`${prefix} ${message}`, ...data);
        }
    },

    /**
     * Auth-specific logging (development only)
     * Use for logging authentication operations
     * Automatically prefixes with [auth] for easy filtering
     * 
     * @param message - The auth message
     * @param data - Optional additional data to log
     */
    auth: (message: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            console.log('[auth] 🔐', message, ...data);
        }
    },

    /**
     * Drive-specific logging (development only)
     * Use for logging Google Drive operations
     * Automatically prefixes with [drive] for easy filtering
     * 
     * @param message - The drive message
     * @param data - Optional additional data to log
     */
    drive: (message: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            console.log('[drive] 📁', message, ...data);
        }
    },

    /**
     * Restore-specific logging (development only)
     * Use for logging project restore operations
     * Automatically prefixes with [restore] for easy filtering
     * 
     * @param message - The restore message
     * @param data - Optional additional data to log
     */
    restore: (message: string, ...data: unknown[]) => {
        if (isDevelopment && !isTest) {
            console.log('[restore] 🔄', message, ...data);
        }
    },
};

/**
 * Re-export logger as default for convenience
 */
export default logger;
