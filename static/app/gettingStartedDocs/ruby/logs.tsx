import {ExternalLink} from '@sentry/scraps/link';

import type {
  BasePlatformOptions,
  OnboardingConfig,
} from 'sentry/components/onboarding/gettingStartedDoc/types';
import {StepType} from 'sentry/components/onboarding/gettingStartedDoc/types';
import {t, tct} from 'sentry/locale';

export const logs = <PlatformOptions extends BasePlatformOptions = BasePlatformOptions>({
  docsPlatform,
}: {
  docsPlatform: string;
}): OnboardingConfig<PlatformOptions> => ({
  install: () => [
    {
      type: StepType.INSTALL,
      content: [
        {
          type: 'text',
          text: tct(
            "Logs are enabled by default in Sentry Ruby SDK version [code:7.0.0] and higher. If you're on an older major version of the SDK, follow our [link:migration guide] to upgrade.",
            {
              code: <code />,
              link: (
                <ExternalLink
                  href={
                    docsPlatform === 'ruby'
                      ? 'https://docs.sentry.io/platforms/ruby/migration/'
                      : `https://docs.sentry.io/platforms/ruby/guides/${docsPlatform}/migration/`
                  }
                />
              ),
            }
          ),
        },
        {
          type: 'code',
          language: 'bash',
          code: 'gem install sentry-ruby',
        },
      ],
    },
  ],
  configure: () => [
    {
      type: StepType.CONFIGURE,
      content: [
        {
          type: 'text',
          text: tct(
            'The SDK sends logs to Sentry by default. To also forward logs from the Ruby standard library logger, enable the [code:logger] patch.',
            {
              code: <code />,
            }
          ),
        },
        {
          type: 'code',
          language: 'ruby',
          code: `require 'sentry-ruby'

Sentry.init do |config|
  # Patch Ruby logger to forward its logs to Sentry
  config.enabled_patches << :logger${
    docsPlatform === 'rails'
      ? `

  # Send Rails framework events, like ActiveRecord queries
  # and controller actions, as logs
  config.rails.structured_logging.enabled = true`
      : ''
  }
end`,
        },
      ],
    },
  ],
  verify: () => [
    {
      type: StepType.VERIFY,
      content: [
        {
          type: 'text',
          text: t('You can use the Ruby stdlib logger to test sending logs to Sentry.'),
        },
        {
          type: 'code',
          language: 'ruby',
          code: `require 'logger'

logger = Logger.new($stdout)
logger.info("Sentry test log from stdlib logger")`,
        },
        {
          type: 'text',
          text: t('You can also use the Sentry logger APIs to send logs to Sentry.'),
        },
        {
          type: 'code',
          language: 'ruby',
          code: 'Sentry.logger.info("Test log from %{test_source}", test_source: "Sentry")',
        },
      ],
    },
  ],
});
