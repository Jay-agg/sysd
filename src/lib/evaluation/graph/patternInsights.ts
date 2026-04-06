import type { SimEdge, SimNode } from '@/types/simulation';
import type { GraphInsightItem } from '@/types/evaluation';
import { detectPatterns } from './patternDetector';

/**
 * Positive pattern highlights for the insights section.
 */
export function patternInsights(nodes: SimNode[], edges: SimEdge[]): GraphInsightItem[] {
  const p = detectPatterns(nodes, edges);
  const items: GraphInsightItem[] = [];

  if (p.async_processing) {
    items.push({
      type: 'pattern',
      message: 'Async processing path detected (API → broker → workers).',
      severity: 'low',
    });
  }
  if (p.caching) {
    items.push({
      type: 'pattern',
      message: 'Caching layer reduces hot-path latency to storage.',
      severity: 'low',
    });
  }
  if (p.load_balancing) {
    items.push({
      type: 'pattern',
      message: 'Load balancing or horizontally scaled app tier spreads traffic.',
      severity: 'low',
    });
  }
  if (p.horizontal_scaling) {
    items.push({
      type: 'pattern',
      message: 'Horizontal scaling improves request throughput.',
      severity: 'low',
    });
  }

  return items;
}
