'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import BaseSimNode, { type SimNodeData } from './BaseSimNode';
import { Zap } from 'lucide-react';

function CacheNode(props: NodeProps) {
  const data = props.data as SimNodeData;
  return <BaseSimNode {...props} data={{ ...data, icon: <Zap size={16} strokeWidth={1.8} /> }} />;
}

export default memo(CacheNode);
