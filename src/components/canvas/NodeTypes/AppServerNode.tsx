'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import BaseSimNode, { type SimNodeData } from './BaseSimNode';
import { Server } from 'lucide-react';

function AppServerNode(props: NodeProps) {
  const data = props.data as SimNodeData;
  return <BaseSimNode {...props} data={{ ...data, icon: <Server size={16} strokeWidth={1.8} /> }} />;
}

export default memo(AppServerNode);
