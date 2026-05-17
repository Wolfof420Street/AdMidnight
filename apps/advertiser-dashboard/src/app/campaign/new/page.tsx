'use client';

import { type FormEvent, useState } from 'react';
import {
  INTEREST_CATEGORIES,
  type InterestCategory,
} from '@admidnight/shared';
import { Card } from '@/components/ui/Card';
import { ProofBadge } from '@/components/ui/ProofBadge';
import {
  CAMPAIGN_FORM_STEPS,
  type CampaignFormStep,
  type CreateCampaignFormData,
} from '@/features/campaigns/types';
import { ApiError } from '@/lib/api/client';
import { campaignsApi } from '@/lib/api/campaigns.api';
import { useRouter } from 'next/navigation';

type FormTextField =
  | 'title'
  | 'description'
  | 'imageUrl'
  | 'clickUrl'
  | 'advertiserName'
  | 'budgetMidnight'
  | 'cpmBidMidnight'
  | 'startTime'
  | 'endTime';

export default function NewCampaignPage(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<CampaignFormStep>('segment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCampaignFormData>({
    targetCategories: [],
    similarityThreshold: 0.75,
    title: '',
    description: '',
    imageUrl: '',
    clickUrl: '',
    advertiserName: '',
    budgetMidnight: '',
    cpmBidMidnight: '',
    startTime: '',
    endTime: '',
  });

  const stepIndex = CAMPAIGN_FORM_STEPS.indexOf(step);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await campaignsApi.create(formData);
      router.push('/');
    } catch (submissionError) {
      if (submissionError instanceof ApiError && submissionError.status === 401) {
        setError('Your session expired. Sign in again to create a campaign.');
      } else if (submissionError instanceof ApiError && submissionError.status === 408) {
        setError('Campaign submission timed out while the proof service was still working. Please retry.');
      } else {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : 'Campaign creation failed',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] py-16">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10">
          <a
            href="/"
            className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-white"
          >
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold">New Campaign</h1>
          <p className="mt-2 text-sm text-gray-400">
            Your targeting parameters generate ZK proofs on-device. No user data
            is ever sent here.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--color-proof)]/20 bg-[var(--color-proof)]/5 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">
              Privacy-preserving campaign creation
            </div>
            <div className="text-xs text-gray-400">
              This flow creates only public campaign parameters for the backend.
            </div>
          </div>
          <ProofBadge size="md" />
        </div>

        <div className="mb-10 flex items-center gap-2">
          {CAMPAIGN_FORM_STEPS.map((currentStep, index) => (
            <div key={currentStep} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  index <= stepIndex
                    ? 'bg-[var(--color-accent)] text-[var(--color-midnight)]'
                    : 'bg-white/10 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs capitalize ${
                  index === stepIndex ? 'text-white' : 'text-gray-600'
                }`}
              >
                {currentStep}
              </span>
              {index < CAMPAIGN_FORM_STEPS.length - 1 ? (
                <div
                  className={`h-px w-8 ${
                    index < stepIndex
                      ? 'bg-[var(--color-accent)]'
                      : 'bg-white/10'
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} data-testid="campaign-form">
          {step === 'segment' ? (
            <Card>
              <h2 className="mb-4 font-semibold">Targeting Segment</h2>
              <p className="mb-5 text-xs text-gray-500">
                Select interest categories. These generate the public segment
                centroid used in ZK circuits while individual user data remains
                private on-device.
              </p>

              <div className="mb-5 grid grid-cols-3 gap-2">
                {INTEREST_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        targetCategories: prev.targetCategories.includes(category)
                          ? prev.targetCategories.filter(
                              (value) => value !== category,
                            )
                          : [...prev.targetCategories, category as InterestCategory],
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      formData.targetCategories.includes(category)
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Similarity Threshold: {formData.similarityThreshold}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={formData.similarityThreshold}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      similarityThreshold: parseFloat(event.target.value),
                    }))
                  }
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                  <span>Broader reach</span>
                  <span>Precise targeting</span>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 'creative' ? (
            <Card className="space-y-4">
              <h2 className="mb-4 font-semibold">Ad Creative</h2>
              {[
                ['title', 'Ad Title', 'text', 'e.g. Premium Gear for Champions'],
                ['description', 'Description', 'text', 'Max 140 characters'],
                ['imageUrl', 'Image URL', 'url', 'https://cdn.example.com/ad.jpg'],
                ['clickUrl', 'Landing Page URL', 'url', 'https://example.com/offer'],
                ['advertiserName', 'Your Brand Name', 'text', 'Acme Corp'],
              ].map(([field, label, type, placeholder]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-gray-400">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={formData[field as FormTextField] ?? ''}
                      data-testid={`campaign-${field}`}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              ))}
            </Card>
          ) : null}

          {step === 'budget' ? (
            <Card className="space-y-4">
              <h2 className="mb-4 font-semibold">Budget & Schedule</h2>
              {[
                ['budgetMidnight', 'Total Budget (tMIDN)', 'e.g. 10000'],
                ['cpmBidMidnight', 'CPM Bid (tMIDN per 1000 impressions)', 'e.g. 500'],
                ['startTime', 'Start Date', ''],
                ['endTime', 'End Date', ''],
              ].map(([field, label, placeholder]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-gray-400">
                    {label}
                  </label>
                  <input
                    type={field.includes('Time') ? 'date' : 'text'}
                    placeholder={placeholder}
                    value={formData[field as FormTextField] ?? ''}
                      data-testid={`campaign-${field}`}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              ))}

              <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="mb-3 text-xs text-gray-500">
                  Protocol Revenue Split
                </div>
                <div className="mb-2 flex h-3 gap-1 overflow-hidden rounded-full">
                  <div className="flex-[70] bg-blue-400" title="Publisher: 70%" />
                  <div
                    className="flex-[20] bg-[var(--color-accent)]"
                    title="User reward: 20%"
                  />
                  <div
                    className="flex-[10] bg-[var(--color-proof)]"
                    title="Protocol: 10%"
                  />
                </div>
                <div className="flex gap-4 text-[10px] text-gray-500">
                  <span>Publisher 70%</span>
                  <span>User 20%</span>
                  <span>Protocol 10%</span>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 'review' ? (
            <Card className="space-y-4">
              <h2 className="font-semibold">Review Campaign</h2>
              <p className="text-xs text-gray-500">
                This dashboard submits only public campaign parameters. User
                matching stays on-device and is proven with ZK proofs.
              </p>
              <div className="grid gap-3 text-sm text-gray-300">
                <div>Advertiser identity: derived from your signed JWT</div>
                <div>Categories: {formData.targetCategories.join(', ') || 'None selected'}</div>
                <div>Budget: {formData.budgetMidnight || '0'} tMIDN</div>
                <div>CPM Bid: {formData.cpmBidMidnight || '0'} tMIDN</div>
                <div>Window: {formData.startTime || 'unset'} to {formData.endTime || 'unset'}</div>
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {isSubmitting ? (
                <p
                  className="rounded-xl border border-[var(--color-proof)]/20 bg-[var(--color-proof)]/5 px-4 py-3 text-sm text-[var(--color-proof)]"
                  data-testid="campaign-loading"
                >
                  Generating ZK proof and submitting campaign to the backend...
                </p>
              ) : null}
            </Card>
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(CAMPAIGN_FORM_STEPS[stepIndex - 1])}
              disabled={step === CAMPAIGN_FORM_STEPS[0]}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 disabled:opacity-40"
              data-testid="campaign-back"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              {step !== CAMPAIGN_FORM_STEPS[CAMPAIGN_FORM_STEPS.length - 1] ? (
                <button
                  type="button"
                  onClick={() => setStep(CAMPAIGN_FORM_STEPS[stepIndex + 1])}
                  className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-midnight)]"
                  data-testid="campaign-continue"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-midnight)] disabled:opacity-60"
                  data-testid="campaign-submit"
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
