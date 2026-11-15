"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { DEMO_PASSWORD } from "@/lib/catalog";
import { loginAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { LocaleToggle, ThemeToggle } from "./toggles";

const DEMOS = [
  { email: "admin@operio.local", ar: "مسؤول أعلى · القطاع", en: "Super admin · Sector" },
  { email: "sector@operio.local", ar: "مدير · القطاع", en: "Admin · Sector" },
  { email: "sector.staff@operio.local", ar: "موظف · القطاع", en: "Employee · Sector" },
  { email: "east.minya.super@operio.local", ar: "مسؤول أعلى · شرق المنيا", en: "Super admin · East Minya" },
  { email: "east.minya.admin@operio.local", ar: "مدير · شرق المنيا", en: "Admin · East Minya" },
  { email: "east.minya@operio.local", ar: "موظف · شرق المنيا", en: "Employee · East Minya" },
];

export function LoginForm() {
  const { d, t, locale } = useI18n();
  const [state, action] = useActionState(loginAction, null);
  const [email, setEmail] = useState("sector@operio.local");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [show, setShow] = useState(false);
  const picked = DEMOS.find((demo) => demo.email === email);

  return (
    <div className="login-screen">
      <section className="brand-panel">
        <div>
          <img className="round-seal" src="/brand/ministry.jpg" alt="" width={48} height={48} />
          <div className="seal" style={{ marginTop: 18 }}>
            <img src="/brand/sector.jpg" alt={locale === "ar" ? "شعار قطاع الري" : "Irrigation Sector logo"} />
          </div>
          <h1>{d.appName}</h1>
          <hr className="gold-rule" />
          <p style={{ maxWidth: 380, margin: 0 }}>{d.tagline}</p>
          <p className="fine" style={{ color: "#d5e7ef", marginTop: 18 }}>
            {locale === "ar" ? "النشر · الفتح الفني · الفتح المالي · البت المالي" : "Publication · Technical opening · Financial opening · Award"}
          </p>
        </div>
        <svg className="wave" viewBox="0 0 600 90" aria-hidden="true">
          <path d="M0 50c40 16 80 16 120 0s80-16 120 0 80 16 120 0 80-16 120 0 80 16 120 0v40H0z" fill="rgba(255,255,255,.14)" />
          <path d="M0 64c40 14 80 14 120 0s80-14 120 0 80 14 120 0 80-14 120 0 80 14 120 0v26H0z" fill="rgba(198,161,91,.45)" />
        </svg>
      </section>
      <main className="login-main">
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <div className="login-card">
          <div>
            <p className="kicker">{d.sector}</p>
            <h1>{d.login.welcome}</h1>
            <p className="lede">{d.ministry}</p>
            {picked ? <p className="chip gold" style={{ marginTop: 10 }}>{t("الدور", "Role")}: {locale === "ar" ? picked.ar : picked.en}</p> : null}
          </div>
          <form action={action} className="stack">
            <label className="field">
              <span>{d.login.email}</span>
              <input className="input" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="field">
              <span>{d.login.password}</span>
              <input className="input" name="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <div className="between">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShow((value) => !value)}>
                {show ? d.login.hide : d.login.show}
              </button>
              <SubmitButton label={d.login.submit} pendingLabel={d.common.saving} />
            </div>
            <FormMessage result={state} />
          </form>
          <div className="stack">
            <div>
              <b>{d.login.demoTitle}</b>
              <p className="note" style={{ margin: "2px 0 0" }}>{d.login.demoHint}: {DEMO_PASSWORD}</p>
            </div>
            <div className="demo-grid">
              {DEMOS.map((demo) => (
                <button
                  key={demo.email}
                  className="demo-card"
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  <b>{locale === "ar" ? demo.ar : demo.en}</b>
                  <small>{demo.email}</small>
                </button>
              ))}
            </div>
            <p className="fine">{t("أسيوط ودمياط والبحيرة موظفون في إداراتهم بنفس كلمة المرور.", "Asyut, Damietta, and Beheira sign in as employees of their departments with the same password.")}</p>
            <p className="fine">02-20543168 · info.irrigation2@mwri.gov.eg</p>
          </div>
        </div>
      </main>
    </div>
  );
}
