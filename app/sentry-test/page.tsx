'use client';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useState } from 'react';

export default function SentryTestPage() {
    const [shouldError, setShouldError] = useState(false);

    if (shouldError) {
        throw new Error('Test Client Error');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-2xl font-bold">Sentry Integration Test</h1>

            <div className="flex flex-col gap-4">
                <Button
                    variant="destructive"
                    onClick={() => setShouldError(true)}
                >
                    Trigger Client Error
                </Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        logger.error('Test Logger Error', new Error('Manual logger error'), {
                            context: 'Sentry Test Page'
                        });
                        alert('Logged error to Sentry check console/dashboard');
                    }}
                >
                    Trigger Logger Error
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => {
                        logger.warn('Test Logger Warning', {
                            context: 'Sentry Test Page'
                        });
                        alert('Logged warning to Sentry check console/dashboard');
                    }}
                >
                    Trigger Logger Warning
                </Button>
            </div>
        </div>
    );
}
