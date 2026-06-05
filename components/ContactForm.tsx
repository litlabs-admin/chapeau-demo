"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

type Fields = { name: string; email: string; company: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", email: "", company: "", message: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Tell us who you are.";
  if (!f.email.trim()) e.email = "We need an email to reply.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "That email doesn't look right.";
  if (f.message.trim().length < 12)
    e.message = "A sentence or two about the bottleneck helps.";
  return e;
}

const fieldBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-text0 placeholder:text-text2 transition-colors";

/**
 * Real, fully-stated contact form: inline validation, accessible error
 * messaging, and a success state. No backend wired — submit resolves locally;
 * swap `onSubmit` for a real endpoint (or server action) at integration time.
 */
export function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate(fields);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    // TODO: POST to a real endpoint / server action here.
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 650);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[22px] border bg-white p-10 text-center"
        style={{ borderColor: "var(--line)", boxShadow: "var(--shadow-soft)" }}
      >
        <span
          className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ background: "var(--cyan-deep)" }}
        >
          <Check size={22} />
        </span>
        <h2 className="display text-3xl">Thanks, {fields.name.split(" ")[0]}.</h2>
        <p className="mx-auto mt-3 max-w-sm text-text1">
          We read every note ourselves and reply within two working days — usually
          with where we&apos;d start, not a calendar link.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-[22px] border bg-white p-6 sm:p-8"
      style={{ borderColor: "var(--line)", boxShadow: "var(--shadow-soft)" }}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          value={fields.name}
          onChange={(v) => update("name", v)}
          error={errors.name}
          placeholder="Jordan Rivera"
          autoComplete="name"
        />
        <Field
          label="Work email"
          name="email"
          type="email"
          value={fields.email}
          onChange={(v) => update("email", v)}
          error={errors.email}
          placeholder="jordan@company.com"
          autoComplete="email"
        />
      </div>

      <div className="mt-5">
        <Field
          label="Company"
          name="company"
          value={fields.company}
          onChange={(v) => update("company", v)}
          placeholder="Optional"
          autoComplete="organization"
          optional
        />
      </div>

      <div className="mt-5">
        <Field
          label="What's slowing growth?"
          name="message"
          as="textarea"
          value={fields.message}
          onChange={(v) => update("message", v)}
          error={errors.message}
          placeholder="The bottleneck you can't crack — pipeline, CAC, attribution, the team's underwater…"
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <MagneticButton type="submit" arrow={!submitting}>
          {submitting ? "Sending…" : "Send it over"}
        </MagneticButton>
        <p className="text-sm text-text2">No deck. No discovery retainer.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  as = "input",
  autoComplete,
  optional = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  as?: "input" | "textarea";
  autoComplete?: string;
  optional?: boolean;
}) {
  const errId = error ? `${name}-error` : undefined;
  const borderColor = error ? "rgba(220,38,38,0.55)" : "var(--line-strong)";

  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-2 text-sm font-medium text-text0">
        {label}
        {optional && <span className="text-xs font-normal text-text2">optional</span>}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          aria-invalid={!!error}
          aria-describedby={errId}
          className={`${fieldBase} resize-y`}
          style={{ borderColor }}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={errId}
          className={fieldBase}
          style={{ borderColor }}
        />
      )}
      {error && (
        <span id={errId} className="mt-1.5 block text-sm" style={{ color: "#dc2626" }}>
          {error}
        </span>
      )}
    </label>
  );
}
