import React, { useState } from 'react';
import { ArrowDownToLine, Check, Send } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { trackVisit } from '../lib/analytics';
import { cn } from '../lib/utils';
import { BlueprintFrame, MagneticButton, Section, SignalEdge } from './blueprint';

const EMAIL = 'rugvedzarkar@gmail.com';

const contactRows: { label: string; value: string; href?: string; external?: boolean }[] = [
  { label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
  { label: 'Phone', value: '443-567-0781', href: 'tel:443-567-0781' },
  { label: 'Location', value: 'Clarksville, MD' },
  { label: 'GitHub', value: 'rzarka1298', href: 'https://github.com/rzarka1298', external: true },
  { label: 'LinkedIn', value: 'rugved-zarkar', href: 'https://www.linkedin.com/in/rugved-zarkar', external: true },
  { label: 'Instagram', value: 'rugvedzarkar', href: 'https://www.instagram.com/rugvedzarkar/', external: true },
];

/**
 * Sheet 06: the closing sheet. A big magnetic email CTA fed by a signal
 * wire, an annotated contact block and the message form. The form posts
 * to the Supabase `api/contact` function exactly as before.
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
          apikey: publicAnonKey,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Message sent successfully! I'll get back to you soon.", {
          description: 'Thank you for reaching out. I typically respond within 24 hours.',
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });

        console.log('📧 Contact form submitted:', { id: result.id });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message', {
        description: 'Please try again or reach out via email directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadResume = () => {
    // Track resume download (same event as before: page /resume-download, referrer contact-form)
    trackVisit('/resume-download', 'contact-form');

    // Must be served from public/ — Vite does not serve the sibling assets/ directory
    const link = document.createElement('a');
    link.href = '/Zarkar_Rugved_Resume.pdf';
    link.download = 'Rugved_Zarkar_Resume.pdf';
    link.click();

    toast.success('Resume downloaded successfully!');
  };

  return (
    <Section
      id="contact"
      index={6}
      label="Contact"
      title="Let's work together"
      intro="Have a project in mind? Send me a message, or email me directly."
      className="overflow-x-clip"
    >
      {/* Big CTA, fed by a signal wire */}
      <div className="relative">
        <svg aria-hidden="true" className="pointer-events-none absolute -left-4 -top-8 h-8 w-[calc(100%+1rem)] sm:-left-6 sm:w-[calc(100%+1.5rem)]">
          <SignalEdge d="M0 4 H40 L56 20 H2000" draw="view" duration={1.4} dots={2} speed={3.2} />
        </svg>
        <MagneticButton
          href={`mailto:${EMAIL}`}
          strength={0.12}
          max={8}
          className="group relative w-full justify-between gap-6 border border-bp-line/60 bg-bp-panel px-5 py-8 text-left transition-colors hover:border-bp-signal sm:px-8 sm:py-12"
        >
          <span className="flex min-w-0 flex-col gap-4">
            <span className="bp-label text-bp-signal-ink">Email me</span>
            <span className="break-words font-display text-[clamp(1.3rem,5.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-bp-ink">
              {EMAIL}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="hidden h-14 w-14 shrink-0 items-center justify-center bg-bp-signal text-[hsl(214_74%_11%)] transition-transform duration-300 group-hover:-rotate-12 sm:flex lg:h-20 lg:w-20"
          >
            <Send className="h-5 w-5 lg:h-7 lg:w-7" />
          </span>
          <span aria-hidden="true" className="absolute -bottom-px left-0 h-px w-0 bg-bp-signal transition-[width] duration-500 ease-blueprint group-hover:w-full" />
        </MagneticButton>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* Annotated contact block */}
        <div>
          <BlueprintFrame label="Notes / Contact" solid bordered className="px-5 pb-4 pt-7 sm:px-6">
            <dl>
              {contactRows.map((row, i) => (
                <div key={row.label} className="flex items-baseline gap-3 border-b border-bp-line-soft/25 py-3 last:border-b-0">
                  <dt className="flex shrink-0 items-baseline gap-2.5">
                    <span aria-hidden="true" className="font-mono text-[0.6875rem] text-bp-line-soft">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="bp-label text-bp-line">{row.label}</span>
                  </dt>
                  <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-bp-line-soft/60" />
                  <dd className="min-w-0 text-right">
                    {row.href ? (
                      <a
                        href={row.href}
                        {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="break-all text-[0.9375rem] text-bp-ink underline-offset-4 transition-colors hover:text-bp-line hover:underline"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="text-[0.9375rem] text-bp-ink">{row.value}</span>
                    )}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline gap-3 py-3">
                <dt className="flex shrink-0 items-baseline gap-2.5">
                  <span aria-hidden="true" className="font-mono text-[0.6875rem] text-bp-line-soft">
                    07
                  </span>
                  <span className="bp-label text-bp-line">Résumé</span>
                </dt>
                <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-bp-line-soft/60" />
                <dd>
                  <button
                    type="button"
                    onClick={downloadResume}
                    className="inline-flex items-center gap-2 text-[0.9375rem] text-bp-ink underline-offset-4 transition-colors hover:text-bp-line hover:underline"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 text-bp-line" aria-hidden="true" />
                    Download PDF
                  </button>
                </dd>
              </div>
            </dl>
          </BlueprintFrame>

          <ul className="mt-8 space-y-3 font-mono text-xs leading-relaxed text-bp-ink-dim">
            <li className="flex gap-3">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bp-line" aria-hidden="true" />I usually reply within
              24 hours.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-bp-signal" />
              Ask me about my wearable robotics research.
            </li>
          </ul>
        </div>

        {/* Message form */}
        <BlueprintFrame label="Form 06-A / Message" solid bordered className="p-5 pt-8 sm:p-8 sm:pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Field id="name" label="Name" no="01">
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className={inputClass}
                />
              </Field>
              <Field id="email" label="Email" no="02">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field id="subject" label="Subject" no="03">
              <input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What's this about?"
                className={inputClass}
              />
            </Field>

            <Field id="message" label="Message" no="04">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Tell me about your project or idea..."
                className={cn(inputClass, 'resize-none')}
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex h-12 w-full items-center justify-center gap-2.5 bg-bp-signal px-5 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[hsl(214_74%_11%)] transition-colors hover:bg-bp-signal/90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin border-2 border-current border-r-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  Send message
                </>
              )}
            </button>
          </form>
        </BlueprintFrame>
      </div>
    </Section>
  );
}

const inputClass =
  'block w-full border border-bp-line-soft/60 bg-bp-bg/70 px-3.5 py-3 text-base text-bp-ink placeholder:text-bp-ink-dim/60 transition-colors hover:border-bp-line/70 focus:border-bp-signal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bp-signal';

function Field({ id, label, no, children }: { id: string; label: string; no: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <label htmlFor={id} className="mb-2 flex items-baseline gap-2.5">
        <span aria-hidden="true" className="font-mono text-[0.6875rem] text-bp-line-soft">
          {no}
        </span>
        <span className="bp-label text-bp-line transition-colors group-focus-within:text-bp-signal-ink">
          {label} <span aria-hidden="true">*</span>
        </span>
      </label>
      {children}
    </div>
  );
}
