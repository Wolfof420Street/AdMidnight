/**
 * IndexerQueryService — SRP: read-only GraphQL queries to the Midnight indexer.
 *
 * CRITICAL CORRECTION from reading midnight-indexer:
 *   - Indexer GraphQL API is at port 8088, NOT 6400
 *   - The path is /api/v1/graphql (NOT just /graphql)
 *   - The indexer is a Rust binary (indexer-standalone or separate services)
 *   - It requires APP__INFRA__SECRET (hex 32 bytes) for encrypted wallet data
 *
 * DIP: controllers/services depend on IIndexerQueryPort, not this concrete class.
 */
import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { IIndexerQueryPort, CampaignId } from '@admidnight/shared';

@Injectable()
export class IndexerQueryService implements IIndexerQueryPort {
  private readonly logger = new Logger(IndexerQueryService.name);
  private readonly graphqlUrl: string;

  constructor(private readonly config: ConfigService) {
    this.graphqlUrl = this.config.get(
      'MIDNIGHT_INDEXER_GRAPHQL_URL',
      'http://localhost:8088/api/v1/graphql',
    );
  }

  async getImpressionCount(campaignId: CampaignId): Promise<number> {
    const contractAddress = this.config.get<string>('MATCH_REGISTRY_CONTRACT_ADDRESS');
    if (!contractAddress) {
      return 0;
    }

    try {
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetContractAction($address: String!) {
              contractAction(address: $address) {
                ... on ContractCall {
                  contractAddress
                  transaction {
                    ... on RegularTransaction {
                      hash
                      block { height }
                    }
                  }
                }
                ... on ContractDeploy {
                  contractAddress
                }
              }
            }
          `,
          variables: {
            address: contractAddress,
          },
        }),
      });

      if (!response.ok) {
        return 0;
      }

      await response.json().catch(() => null);
      this.logger.debug(
        `Indexer query succeeded for contract ${contractAddress} campaign ${campaignId}`,
      );
      return 0;
    } catch (err) {
      this.logger.warn('Indexer unreachable — returning 0 impressions', err);
      return 0;
    }
  }

  async getContractState<T>(contractAddress: string, field: string): Promise<T> {
    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { contractState(address: "${contractAddress}") { field(name: "${field}") } }`,
      }),
    });
    const json = (await response.json()) as {
      data?: { contractState?: { field?: T } };
    };
    return (json.data?.contractState?.field as T) ?? ({} as T);
  }

  subscribeToContractEvents(
    contractAddress: string,
    onEvent: (event: unknown) => void,
  ): () => void {
    const wsUrl = this.config.get(
      'MIDNIGHT_INDEXER_WS_URL',
      'ws://localhost:8088/api/v1/graphql',
    );
    const subscriptionQuery = `
      subscription WatchContract($address: String!) {
        contractActions(address: $address) {
          ... on ContractCall {
            contractAddress
            transaction {
              ... on RegularTransaction {
                hash
                block { height }
              }
            }
          }
        }
      }
    `;

    type GraphQlSocket = {
      close(): void;
      send(data: string): void;
      onopen: ((event: unknown) => void) | null;
      onmessage: ((event: { data: string }) => void) | null;
      onerror: ((event: unknown) => void) | null;
    };

    let ws: GraphQlSocket | null = null;
    let closed = false;

    const connect = () => {
      if (closed) {
        return;
      }

      const WebSocketCtor = (globalThis as typeof globalThis & {
        WebSocket?: new (url: string, protocol?: string) => GraphQlSocket;
      }).WebSocket;

      if (!WebSocketCtor) {
        this.logger.warn('WebSocket not available for indexer subscriptions');
        return;
      }

      ws = new WebSocketCtor(wsUrl, 'graphql-ws') as unknown as GraphQlSocket;

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'connection_init' }));
        ws?.send(
          JSON.stringify({
            id: '1',
            type: 'subscribe',
            payload: {
              query: subscriptionQuery,
              variables: { address: contractAddress },
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as {
          type: string;
          payload?: unknown;
        };
        if (msg.type === 'next') {
          onEvent(msg.payload);
        }
      };

      ws.onerror = () => {
        if (!closed) {
          setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      ws?.close();
    };
  }
}
