import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertCircle, Mail, MailCheck, MapPin, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CONTACT_EMAIL = 'coastalvista@alchemistlabs.cloud';

const projectTypes = [
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'events', label: 'Events' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const timelines = [
  { value: 'asap', label: 'ASAP' },
  { value: '1-2-weeks', label: '1-2 Weeks' },
  { value: '1-month', label: '1 Month' },
  { value: 'flexible', label: 'Flexible' },
];

interface FormData {
  name: string;
  email: string;
  projectType: string;
  timeline: string;
  message: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'mailto' | 'error';

const emptyForm: FormData = {
  name: '',
  email: '',
  projectType: '',
  timeline: '',
  message: '',
};

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (data.name.trim().length < 2) {
    errors.name = 'Please enter your name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!data.projectType) {
    errors.projectType = 'Please choose a project type.';
  }
  if (!data.timeline) {
    errors.timeline = 'Please choose a timeline.';
  }
  if (data.message.trim().length < 10) {
    errors.message = 'Please tell me a little more about your project (at least 10 characters).';
  }
  return errors;
}

// A real Formspree endpoint looks like https://formspree.io/f/abcdwxyz.
// Placeholder values (from .env.example or CI previews) fall back to mailto.
function resolveFormspreeEndpoint(): string | null {
  const endpoint = (import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined)?.trim();
  if (!endpoint) return null;
  if (!endpoint.startsWith('https://formspree.io/f/')) return null;
  if (endpoint.includes('your_form_id') || endpoint.includes('placeholder')) return null;
  return endpoint;
}

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formspreeEndpoint = resolveFormspreeEndpoint();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Respect reduced-motion: leave columns/details in their final visible state.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Left column animation
      gsap.fromTo(
        leftColRef.current,
        { x: '-6vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 40%',
            scrub: 0.5,
          },
        }
      );

      // Form card animation
      gsap.fromTo(
        formCardRef.current,
        { x: '6vw', opacity: 0, scale: 0.98 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 40%',
            scrub: 0.5,
          },
        }
      );

      // Contact details stagger
      const detailItems = detailsRef.current?.querySelectorAll('.detail-item');
      if (detailItems) {
        gsap.fromTo(
          detailItems,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              end: 'top 40%',
              scrub: 0.5,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const buildMailtoUrl = (data: FormData): string => {
    const projectLabel =
      projectTypes.find(p => p.value === data.projectType)?.label ?? data.projectType;
    const timelineLabel =
      timelines.find(t => t.value === data.timeline)?.label ?? data.timeline;
    const subject = `Coastal Vista inquiry — ${projectLabel} — ${data.name.trim()}`;
    const body = [
      `Name: ${data.name.trim()}`,
      `Email: ${data.email.trim()}`,
      `Project type: ${projectLabel}`,
      `Timeline: ${timelineLabel}`,
      '',
      data.message.trim(),
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate(formData);
    setFieldErrors(errors);
    const firstInvalid = (Object.keys(emptyForm) as (keyof FormData)[]).find(key => errors[key]);
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    // Mailto fallback: no backend configured, so hand the message to the
    // visitor's own email client with everything pre-filled.
    if (!formspreeEndpoint) {
      window.location.href = buildMailtoUrl(formData);
      setStatus('mailto');
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          projectType: formData.projectType,
          timeline: formData.timeline,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
      }

      setStatus('success');
      setFormData(emptyForm);
    } catch {
      setStatus('error');
      setSubmitError('Unable to send your inquiry right now. Please try again or email me directly.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors({ ...fieldErrors, [name]: undefined });
    }
  };

  const fieldErrorProps = (field: keyof FormData) =>
    fieldErrors[field]
      ? { 'aria-invalid': true as const, 'aria-describedby': `contact-${field}-error` }
      : {};

  const renderFieldError = (field: keyof FormData) =>
    fieldErrors[field] ? (
      <p id={`contact-${field}-error`} role="alert" className="mt-1.5 text-sm text-[#B91C1C]">
        {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative bg-[#F4F6F8] min-h-screen py-[10vh]"
      style={{ zIndex: 100 }}
    >
      <div className="max-w-[1400px] mx-auto px-[6vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Content */}
          <div ref={leftColRef} className="pt-8">
            <h2 className="headline-lg text-[#0B0F17] mb-6">
              Let's make something iconic.
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed mb-12 max-w-md">
              Share a few details and I'll reply with availability, pricing, and next steps.
            </p>

            {/* Contact Details */}
            <div ref={detailsRef} className="space-y-6 mb-12">
              <div className="detail-item flex items-start gap-4">
                <Mail className="w-5 h-5 text-[#3F8EFC] mt-0.5" aria-hidden="true" />
                <div>
                  <p className="caption-mono text-[#6B7280] mb-1">EMAIL</p>
                  <a
                    href="mailto:coastalvista@alchemistlabs.cloud"
                    className="text-[#0B0F17] hover:text-[#3F8EFC] transition-colors"
                  >
                    coastalvista@alchemistlabs.cloud
                  </a>
                </div>
              </div>

              <div className="detail-item flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#3F8EFC] mt-0.5" aria-hidden="true" />
                <div>
                  <p className="caption-mono text-[#6B7280] mb-1">LOCATION</p>
                  <p className="text-[#0B0F17]">Corpus Christi, TX — willing to travel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div
            ref={formCardRef}
            className="bg-white border border-[rgba(11,15,23,0.08)] p-8 md:p-10"
          >
            {status === 'success' ? (
              <div
                role="status"
                aria-live="polite"
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-16 h-16 bg-[#3F8EFC]/10 rounded-full flex items-center justify-center mb-6">
                  <Send className="w-8 h-8 text-[#3F8EFC]" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-display font-bold text-[#0B0F17] mb-3">
                  Message Sent!
                </h3>
                <p className="text-[#6B7280] mb-8">
                  Thanks for reaching out. I'll get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="cta-button justify-center"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="form-label">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="form-input"
                    required
                    {...fieldErrorProps('name')}
                  />
                  {renderFieldError('name')}
                </div>

                <div>
                  <label htmlFor="contact-email" className="form-label">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="form-input"
                    required
                    {...fieldErrorProps('email')}
                  />
                  {renderFieldError('email')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-projectType" className="form-label">Project Type</label>
                    <select
                      id="contact-projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="form-input min-h-[44px]"
                      required
                      {...fieldErrorProps('projectType')}
                    >
                      <option value="">Select...</option>
                      {projectTypes.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {renderFieldError('projectType')}
                  </div>

                  <div>
                    <label htmlFor="contact-timeline" className="form-label">Timeline</label>
                    <select
                      id="contact-timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="form-input min-h-[44px]"
                      required
                      {...fieldErrorProps('timeline')}
                    >
                      <option value="">Select...</option>
                      {timelines.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {renderFieldError('timeline')}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="form-label">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project..."
                    rows={4}
                    className="form-input resize-none"
                    required
                    {...fieldErrorProps('message')}
                  />
                  {renderFieldError('message')}
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full cta-button bg-[#0B0F17] text-white border-[#0B0F17] hover:bg-[#1a1f2a] justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'submitting'
                    ? 'Sending...'
                    : formspreeEndpoint
                      ? 'Send Inquiry'
                      : 'Send via Email'}
                  <Send size={14} aria-hidden="true" />
                </button>

                {!formspreeEndpoint && (
                  <p className="text-sm text-[#6B7280]">
                    This opens your email app with the message pre-filled, addressed to{' '}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-[#3F8EFC] hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    .
                  </p>
                )}

                {status === 'mailto' && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-start gap-3 border border-[#3F8EFC]/30 bg-[#3F8EFC]/5 p-4"
                  >
                    <MailCheck className="w-5 h-5 text-[#3F8EFC] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div className="text-sm text-[#0B0F17]">
                      <p className="font-medium mb-1">Opening your email client…</p>
                      <p className="text-[#6B7280]">
                        Your inquiry is pre-filled and addressed to {CONTACT_EMAIL} — just hit send.
                        If nothing opened,{' '}
                        <a
                          href={buildMailtoUrl(formData)}
                          className="text-[#3F8EFC] hover:underline"
                        >
                          try again
                        </a>{' '}
                        or email me directly.
                      </p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <p role="alert" className="flex items-start gap-2 text-sm text-[#B91C1C]">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                      {submitError}{' '}
                      <a
                        href={buildMailtoUrl(formData)}
                        className="underline"
                      >
                        Email me directly
                      </a>
                    </span>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-[rgba(11,15,23,0.08)]">
        <div className="max-w-[1400px] mx-auto px-[6vw]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#6B7280]">
              © {new Date().getFullYear()} COASTAL VISTA. ALL RIGHTS RESERVED.
            </p>
            <p className="font-mono text-xs text-[#6B7280]">
              FAA PART 107 LICENSED & INSURED
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
