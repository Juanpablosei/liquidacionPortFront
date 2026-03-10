'use client';

import { useTranslation } from '@/lib/i18n';
import { ConvenioCard } from './convenio-card';
import type { Convenio, ConvenioCategory } from '@/lib/types/convenio';

export interface ConvenioSectionProps {
  title: string;
  convenios: Convenio[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  t: ReturnType<typeof useTranslation>;
  badgeVariant: 'own' | 'global';
  canEdit: boolean;
  onClone?: (id: string) => void;
  cloningId?: string | null;
  onEdit?: (conv: Convenio) => void;
  onDelete?: (conv: Convenio) => void;
  onAddCategory?: (convenioId: string) => void;
  onEditCategory?: (convenioId: string, cat: ConvenioCategory) => void;
  onDeleteCategory?: (convenioId: string, cat: ConvenioCategory) => void;
}

export function ConvenioSection({
  title,
  convenios,
  expandedId,
  onToggle,
  t,
  badgeVariant,
  canEdit: canEditProp,
  onClone,
  cloningId,
  onEdit,
  onDelete,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: ConvenioSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title} ({convenios.length})
      </h2>
      <div className="space-y-2">
        {convenios.map((conv) => (
          <ConvenioCard
            key={conv.id}
            convenio={conv}
            isExpanded={expandedId === conv.id}
            onToggle={() => onToggle(conv.id)}
            t={t}
            badgeVariant={badgeVariant}
            canEdit={canEditProp}
            onClone={onClone ? () => onClone(conv.id) : undefined}
            isCloning={cloningId === conv.id}
            onEdit={onEdit ? () => onEdit(conv) : undefined}
            onDelete={onDelete ? () => onDelete(conv) : undefined}
            onAddCategory={onAddCategory ? () => onAddCategory(conv.id) : undefined}
            onEditCategory={onEditCategory ? (cat) => onEditCategory(conv.id, cat) : undefined}
            onDeleteCategory={onDeleteCategory ? (cat) => onDeleteCategory(conv.id, cat) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
