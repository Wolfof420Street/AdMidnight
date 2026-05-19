/**
 * EventsGateway — SRP: translate domain events to SSE stream.
 * SoC: decoupled from ProofRelayService via DomainEventBus.
 * Neither ProofRelayService nor AuctionRelayService know about SSE.
 */
import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import { DomainEventBus } from './domain-event.bus.js';
import type { ProofRelayedEvent, AuctionSettledEvent } from '@admidnight/shared';

export interface SseEvent {
  type: string;
  campaignId: string;
  timestamp: string;
  totalProofsSession: number;
}

@Injectable()
export class EventsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsGateway.name);
  private readonly subject = new Subject<SseEvent>();
  private sessionProofCount = 0;
  private readonly unsubscribers: Array<() => void> = [];

  get events$(): Observable<SseEvent> {
    return this.subject.asObservable();
  }

  constructor(private readonly eventBus: DomainEventBus) {}

  onModuleInit(): void {
    this.unsubscribers.push(
      this.eventBus.subscribe<ProofRelayedEvent>('ProofRelayed', (event) => {
        this.sessionProofCount++;
        this.subject.next({
          type: 'proof_submitted',
          campaignId: event.campaignId,
          timestamp: event.timestamp.toISOString(),
          totalProofsSession: this.sessionProofCount,
        });
      }),
    );

    this.unsubscribers.push(
      this.eventBus.subscribe<AuctionSettledEvent>('AuctionSettled', (event) => {
        this.subject.next({
          type: 'auction_settled',
          campaignId: event.campaignId,
          timestamp: event.timestamp.toISOString(),
          totalProofsSession: this.sessionProofCount,
        });
      }),
    );

    this.logger.log('EventsGateway subscribed to domain events');
  }

  onModuleDestroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.subject.complete();
  }
}
