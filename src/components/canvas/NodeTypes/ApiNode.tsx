'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import BaseSimNode, { type SimNodeData } from './BaseSimNode';
import { Globe } from 'lucide-react';

function ApiNode(props: NodeProps) {
  const data = props.data as SimNodeData;
  return <BaseSimNode {...props} data={{ ...data, icon: <Globe size={16} strokeWidth={1.8} /> }} />;
}

export default memo(ApiNode);
