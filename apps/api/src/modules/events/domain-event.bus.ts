/**
 * DomainEventBus — in-process pub/sub for domain events.
 *
 * SRP: only routes events. No business logic.
 * OCP: new event types add entries to DomainEvent union in shared/ports — no bus changes needed.
 * DIP: EventsGateway (SSE) depends on this bus, not on individual services.
 *
 * Production note: replace with Redis pub/sub for multi-instance deployments.
 * The interface (IDomainEventBus) remains the same — only the implementation swaps.
 */
import { Injectable, Logger } from '@nestjs/common';
import type { IDomainEventBus, DomainEvent } from '@admidnight/shared';

type Handler = (event: DomainEvent) => void;

@Injectable()
export class DomainEventBus implements IDomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);
  private readonly handlers = new Map<string, Set<Handler>>();

  publish(event: DomainEvent): void {
    this.logger.debug(`Event published: ${event.type}`);
    const set = this.handlers.get(event.type);
    if (set) {
      for (const handler of set) {
        try {
          handler(event);
        } catch (err) {
          this.logger.error(`Handler error for ${event.type}:`, err);
        }
      }
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: (event: T) => void,
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const h = handler as Handler;
    this.handlers.get(eventType)!.add(h);
    return () => this.handlers.get(eventType)?.delete(h);
  }
}
