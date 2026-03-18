'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils/cn';
import { PageHeader } from '@/components/shared/page-header';
import { RoleGate } from '@/components/shared/role-gate';
import { useTranslation } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';
import {
  uploadConvenio,
  confirmConvenioUpload,
  deleteUploadedFile,
} from '@/lib/api/convenios';
import type { ConvenioUploadResponse, ConfirmUploadInput } from '@/lib/types/convenio';
import { StepUpload } from './_components/step-upload';
import { StepReview } from './_components/step-review';
import { StepConfirm } from './_components/step-confirm';

type WizardStep = 'upload' | 'review' | 'confirm';

const STEPS: WizardStep[] = ['upload', 'review', 'confirm'];

export default function ConvenioUploadPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const t = useTranslation();

  const [step, setStep] = useState<WizardStep>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [extractedData, setExtractedData] = useState<ConvenioUploadResponse | null>(null);
  const [editedData, setEditedData] = useState<ConvenioUploadResponse | null>(null);

  const stepLabels: Record<WizardStep, string> = {
    upload: t.convenios.upload.stepUpload,
    review: t.convenios.upload.stepReview,
    confirm: t.convenios.upload.stepConfirm,
  };

  // ── Cleanup helper ──────────────────────────────────────────────────────
  const cleanup = useCallback(async () => {
    const sourceFile = extractedData?.sourceFile ?? editedData?.sourceFile;
    if (sourceFile) {
      try {
        await deleteUploadedFile(companyId, sourceFile);
      } catch {
        // best-effort cleanup
      }
    }
  }, [companyId, extractedData?.sourceFile, editedData?.sourceFile]);

  // ── Step 1: Upload ──────────────────────────────────────────────────────
  async function handleUpload(file: File) {
    setIsUploading(true);
    try {
      const result = await uploadConvenio(companyId, file);
      setExtractedData(result);
      setEditedData(result);
      setStep('review');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.convenios.upload.uploadError);
    } finally {
      setIsUploading(false);
    }
  }

  // ── Step 2: Review → Confirm ────────────────────────────────────────────
  function handleReviewConfirm(edited: ConvenioUploadResponse) {
    setEditedData(edited);
    setStep('confirm');
  }

  // ── Step 3: Confirm → Create ────────────────────────────────────────────
  async function handleConfirm() {
    if (!editedData) return;
    setIsConfirming(true);
    try {
      const payload: ConfirmUploadInput = {
        name: editedData.name,
        description: editedData.description,
        sourceFile: editedData.sourceFile,
        ...(editedData.validFrom ? { validFrom: editedData.validFrom } : {}),
        ...(editedData.validTo ? { validTo: editedData.validTo } : {}),
        ...(editedData.vacationDays != null ? { vacationDays: editedData.vacationDays } : {}),
        ...(editedData.sickLeaveDays != null ? { sickLeaveDays: editedData.sickLeaveDays } : {}),
        ...(editedData.seniorityRules.length > 0 ? { seniorityRules: editedData.seniorityRules } : {}),
        ...(editedData.categories.length > 0 ? { categories: editedData.categories } : {}),
      };
      await confirmConvenioUpload(companyId, payload);
      toast.success(t.convenios.upload.confirmed);
      router.push(ROUTES.convenios(companyId));
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.convenios.upload.confirmError);
    } finally {
      setIsConfirming(false);
    }
  }

  // ── Cancel ──────────────────────────────────────────────────────────────
  async function handleCancel() {
    await cleanup();
    router.push(ROUTES.convenios(companyId));
  }

  // ── Back to upload (resets data) ────────────────────────────────────────
  async function handleBackToUpload() {
    await cleanup();
    setExtractedData(null);
    setEditedData(null);
    setStep('upload');
  }

  return (
    <RoleGate roles={['OWNER', 'ADMIN']}>
      <div className="max-w-3xl">
        <PageHeader
          title={t.convenios.upload.title}
          description={t.convenios.upload.description}
          backHref={ROUTES.convenios(companyId)}
        />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const isActive = s === step;
            const isDone = STEPS.indexOf(step) > idx;
            return (
              <div key={s} className="flex items-center gap-2">
                {idx > 0 && (
                  <div
                    className={cn(
                      'h-px w-8',
                      isDone ? 'bg-brand' : 'bg-overlay-strong',
                    )}
                  />
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-brand text-white'
                        : isDone
                          ? 'bg-brand/20 text-brand'
                          : 'bg-overlay text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium hidden sm:inline',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {stepLabels[s]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {step === 'upload' && (
          <StepUpload
            t={t}
            isUploading={isUploading}
            onUpload={handleUpload}
            onCancel={handleCancel}
          />
        )}

        {step === 'review' && editedData && (
          <StepReview
            t={t}
            data={editedData}
            onConfirm={handleReviewConfirm}
            onBack={handleBackToUpload}
          />
        )}

        {step === 'confirm' && editedData && (
          <StepConfirm
            t={t}
            data={editedData}
            isConfirming={isConfirming}
            onConfirm={handleConfirm}
            onBack={() => setStep('review')}
          />
        )}
      </div>
    </RoleGate>
  );
}
