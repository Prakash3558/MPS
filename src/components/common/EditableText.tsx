import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { Edit3, Save, X } from 'lucide-react';

interface EditableTextProps {
  blockKey: string;
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = React.memo(({
  blockKey,
  defaultText,
  className = '',
  as = 'span'
}) => {
  const { getContentBlock } = useCMS();
  const textValue = getContentBlock(blockKey, defaultText);

  const Component = as;
  if (!textValue) return null;
  return <Component className={className}>{textValue}</Component>;
});

