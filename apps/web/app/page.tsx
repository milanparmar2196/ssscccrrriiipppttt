"use client";

import Link from "next/link";
import { PIPELINE_STEPS, PACKAGE_DELIVERABLES } from "@scriptwriter/shared";
import { useAuth } from "../lib/auth";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main className="container">
      <div className="hero">
        <span className="hero-eyebrow">Faceless script studio</span>
        <h1 className="hero-title">AI Script Writer for <span className="grad-text">faceless channels</span></h1>
      <p className="hero-sub">
        Pure script generation: niche strategy, research with verified sources, a locked Production
        Bible, outline, script, scene-by-scene breakdown with visuals defined in text, weighted audit,
        and a production package your tools can consume. No audio or video is generated here — every
        scene tells your production tools exactly what to make.
      </p>
      <div className="row">
        {user ? (
          <Link className="btn" href="/projects">
            Open my projects
          </Link>
        ) : (
          <>
            <Link className="btn" href="/signup">
              Get started
            </Link>
            <Link className="btn secondary" href="/login">
              Log in
            </Link>
          </>
        )}
      </div>
      </div>
      <div className="grid cols2" style={{ marginTop: 24 }}>
        <div className="card feature-card">
          <span className="feature-ico">▦</span>
          <h3>{PIPELINE_STEPS.length}-step pipeline</h3>
          <p className="muted small">
            Niche → topics → research → Bible → outline → script → scenes → audit → package →
            performance feedback. Approvals at topic, outline and final.
          </p>
        </div>
        <div className="card feature-card">
          <span className="feature-ico">▤</span>
          <h3>{PACKAGE_DELIVERABLES.length} package deliverables &amp; records</h3>
          <p className="muted small">
            Final script, scene breakdown, VO instructions, AI prompts, shot directions, captions plan,
            research references, completion certificate and more.
          </p>
        </div>
      </div>
    </main>
  );
}
