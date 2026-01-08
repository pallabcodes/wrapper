export interface IWebhookRepository {
    /**
     * Checks if a webhook event ID has already been processed.
     * @param id The provider's event ID (e.g., evt_...)
     * @param provider The provider name (default: stripe)
     */
    exists(id: string, provider?: string): Promise<boolean>;

    /**
     * Marks a webhook event ID as processed.
     * @param id The provider's event ID
     * @param provider The provider name (default: stripe)
     */
    save(id: string, provider?: string): Promise<void>;
}

export const WEBHOOK_REPOSITORY = Symbol('IWebhookRepository');
