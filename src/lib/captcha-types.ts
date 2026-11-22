/** A captcha challenge as the browser receives it. */
export type CaptchaChallenge = { enabled: false } | { enabled: true; token: string; image: string };
