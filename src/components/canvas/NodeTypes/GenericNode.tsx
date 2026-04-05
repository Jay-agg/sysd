'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import BaseSimNode, { type SimNodeData } from './BaseSimNode';
import { nodeIconMap } from '@/lib/icons';
import type { SimNodeType } from '@/types/simulation';

/**
 * Generic node component that renders any SimNodeType
 * using the centralized Lucide icon map.
 */
function GenericNode(props: NodeProps) {
  const nodeType = ((props.data as Record<string, unknown>).nodeType as SimNodeType) ?? (props.type as SimNodeType);
  const IconComponent = nodeIconMap[nodeType];
  const icon = IconComponent ? <IconComponent size={16} strokeWidth={1.8} /> : null;

  const data = props.data as SimNodeData;
  return <BaseSimNode {...props} data={{ ...data, icon }} />;
}

export default memo(GenericNode);
