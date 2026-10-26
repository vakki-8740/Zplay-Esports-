import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, Copy, Gamepad2, Headphones, ImagePlus, LockKeyhole, Menu,
  QrCode, ShieldCheck, Sparkles, Trophy, Upload, UserRound, X, Zap,
} from 'lucide-react';

const ACCOUNT_KEY = 'zplay-account-v1';
const PROFILE_KEY = 'zplay-player-v1';
const SUBMISSION_KEY = 'zplay-join-submission-v1';
const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
};
const phoneValid = (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''));
const normalizePhone = (value) => value.replace(/\D/g, '').slice(-10);

async function digestPassword(value) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(value)));
}

function Brand({ compact = false }) {
  return <Link to="/join" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Zplay home">
    <span className="brand-mark"><Zap size={17} fill="currentColor" /></span>
    <span className="brand-word">ZPLAY<span className="brand-dot">.</span></span>
    {!compact && <span className="brand-tag">ESPORTS</span>}
  </Link>;
}

function Header({ account, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="topbar">
    <div className="topbar-inner">
      <Brand />
      <div className="topbar-right">
        <span className="live-pill"><i /> REGISTRATION LIVE</span>
        <div className="header-divider" />
        {account ? <div className="user-menu-wrap">
          <button className="user-chip" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            <span className="user-avatar">{(account.name || 'P').slice(0, 1).toUpperCase()}</span>
            <span className="user-chip-name">{account.name || 'Player'}</span>
            <ChevronRight size={14} className={menuOpen ? 'rotate-90' : 'rotate-90'} />
          </button>
          {menuOpen && <div className="user-menu"><span className="menu-label">SIGNED IN AS</span><strong>{account.mobile}</strong><button onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button></div>}
        </div> : <span className="secure-label"><LockKeyhole size={13} /> Secure entry</span>}
        <button className="mobile-menu" aria-label="Open menu"><Menu size={19} /></button>
      </div>
    </div>
  </header>;
}

function StepBar({ active }) {
  const steps = ['Player details', 'Payment', 'Confirmation'];
  return <div className="stepbar" aria-label="Registration progress">
    {steps.map((step, index) => <div className={`step-item ${index + 1 === active ? 'is-active' : ''} ${index + 1 < active ? 'is-done' : ''}`} key={step}>
      <span className="step-count">{index + 1 < active ? <Check size={13} /> : `0${index + 1}`}</span>
      <span className="step-name">{step}</span>
      {index !== steps.length - 1 && <span className="step-line" />}
    </div>)}
  </div>;
}

function TournamentCard() {
  return <aside className="event-card">
    <div className="event-cover">
      <div className="cover-grid" />
      <div className="cover-glow" />
      <span className="event-kicker"><span className="live-dot" /> UPCOMING TOURNAMENT</span>
      <div className="event-art"><span className="art-ring" /><Gamepad2 size={75} strokeWidth={1.05} /></div>
      <div className="cover-caption"><span>COMPETE.</span><span className="accent-text">CONQUER.</span></div>
      <span className="cover-index">ZP / 001</span>
    </div>
    <div className="event-info">
      <div className="event-title-row"><div><span className="tiny-label">BATTLE ROYALE · MOBILE</span><h2>Next up:<br /><em>your moment.</em></h2></div><span className="event-badge"><Trophy size={15} /></span></div>
      <p className="event-copy">Lock in your spot. Complete your player profile and payment details to enter the tournament.</p>
      <div className="event-meta">
        <div><span className="meta-icon"><Clock3 size={15} /></span><span><b>Registration</b><small>Open now</small></span></div>
        <div><span className="meta-icon"><ShieldCheck size={15} /></span><span><b>Fair play</b><small>Verified entries</small></span></div>
      </div>
      <div className="event-footer"><span><span className="status-dot" /> Entries are being accepted</span><span>01 <i>/</i> 03</span></div>
    </div>
  </aside>;
}

function AuthPanel({ onSuccess }) {
  const [tab, setTab] = useState('register');
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const switchTab = (next) => { setTab(next); setError(''); setForm((current) => ({ ...current, name: '' })); };

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (!phoneValid(form.mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (form.password.length < 6) return setError('Your password must be at least 6 characters.');
    if (tab === 'register' && !form.name.trim()) return setError('Please enter your player name.');
    setBusy(true);
    try {
      const mobile = normalizePhone(form.mobile);
      const digest = await digestPassword(form.password);
      if (tab === 'register') {
        if (readJson(ACCOUNT_KEY)?.mobile === mobile) { setError('An account with this number already exists. Please log in.'); setBusy(false); return; }
        const account = { name: form.name.trim(), mobile, passwordDigest: digest };
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
        onSuccess(account);
      } else {
        const saved = readJson(ACCOUNT_KEY);
        if (!saved || saved.mobile !== mobile || saved.passwordDigest !== digest) { setError('That mobile number and password do not match. Try again or create an account.'); setBusy(false); return; }
        onSuccess(saved);
      }
    } catch { setError('We could not save your account on this device. Please try again.'); }
    setBusy(false);
  };

  return <section className="auth-panel">
    <div className="panel-overline"><span className="overline-mark"><LockKeyhole size={14} /></span> PLAYER ACCESS <span className="overline-line" /></div>
    <h1 className="auth-title">Your next win<br />starts <span>here.</span></h1>
    <p className="auth-intro">Sign in or create a player account to join the tournament.</p>
    <div className="auth-tabs" role="tablist" aria-label="Choose an account action">
      <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'selected' : ''} onClick={() => switchTab('register')}>Create account</button>
      <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'selected' : ''} onClick={() => switchTab('login')}>Log in</button>
    </div>
    <form onSubmit={submit} className="form-stack" noValidate>
      {tab === 'register' && <label className="field"><span>Player name</span><div className="input-wrap"><UserRound size={17} /><input autoComplete="name" placeholder="e.g. ShadowStrike" value={form.name} onChange={update('name')} /></div></label>}
      <label className="field"><span>Mobile number</span><div className="input-wrap phone-wrap"><span className="country-code">+91</span><span className="input-separator" /><input inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} /></div></label>
      <label className="field"><span>Password</span><div className="input-wrap"><LockKeyhole size={17} /><input ref={passwordRef} type="password" autoComplete={tab === 'register' ? 'new-password' : 'current-password'} placeholder={tab === 'register' ? 'Set a password (6+ characters)' : 'Enter your password'} value={form.password} onChange={update('password')} /></div></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : tab === 'register' ? 'Create account' : 'Log in'}<ArrowRight size={17} /></button>
    </form>
    <div className="auth-foot"><ShieldCheck size={14} /><span>Your account stays saved on this device. You won’t need to sign in again.</span></div>
  </section>;
}

function PlayerDetails({ account, onContinue }) {
  const [values, setValues] = useState({ name: account?.name || '', mobile: account?.mobile || '', email: '', gameUid: '', gameLevel: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault(); setError('');
    if (!values.name.trim()) return setError('Please enter your player name.');
    if (!phoneValid(values.mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (!/^\S+@\S+\.\S+$/.test(values.email)) return setError('Enter a valid email address.');
    if (!values.gameUid.trim()) return setError('Enter your in-game UID.');
    if (!values.gameLevel) return setError('Select your game ID level.');
    setBusy(true);
    const player = { ...values, mobile: normalizePhone(values.mobile) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(player));
    setTimeout(() => { onContinue(player); setBusy(false); }, 220);
  };
  return <section className="form-panel">
    <div className="panel-overline"><span className="overline-mark"><UserRound size={14} /></span> PLAYER PROFILE <span className="overline-line" /></div>
    <h1 className="section-title">Tell us who<br /><span>you are.</span></h1>
    <p className="section-intro">Use the details linked to your game account. We’ll use these to verify your entry.</p>
    <div className="verified-strip"><BadgeCheck size={17} /><span>Account verified</span><b>+91 {account?.mobile}</b></div>
    <form className="form-stack details-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field"><span>Player name <i>*</i></span><div className="input-wrap"><input placeholder="Your in-game name" value={values.name} onChange={update('name')} /></div></label>
        <label className="field"><span>Mobile number <i>*</i></span><div className="input-wrap"><span className="country-code">+91</span><span className="input-separator" /><input inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={values.mobile} onChange={(event) => setValues((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} /></div></label>
      </div>
      <label className="field"><span>Email address <i>*</i></span><div className="input-wrap"><input type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={update('email')} /></div></label>
      <label className="field"><span>Game UID number <i>*</i></span><div className="input-wrap"><Gamepad2 size={17} /><input inputMode="numeric" placeholder="Enter your in-game UID" value={values.gameUid} onChange={update('gameUid')} /></div><small className="field-hint">Find your UID in your game profile.</small></label>
      <label className="field"><span>Your Game ID level <i>*</i></span><div className="input-wrap"><input type="number" min="1" max="9999" inputMode="numeric" placeholder="Enter your current game level" value={values.gameLevel} onChange={update('gameLevel')} /></div></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary continue-button" disabled={busy}>{busy ? 'Saving details…' : 'Continue to payment'}<ArrowRight size={17} /></button>
      <p className="form-note"><LockKeyhole size={13} /> Your information is only used to process your tournament entry.</p>
    </form>
  </section>;
}

function QRPlaceholder() {
  return <div className="qr-placeholder" aria-label="Tournament QR code placeholder">
    <span className="qr-corner corner-tl" /><span className="qr-corner corner-tr" /><span className="qr-corner corner-bl" />
    <QrCode size={54} strokeWidth={1.25} />
    <b>QR CODE</b><small>Organizer QR will appear here</small>
  </div>;
}

function PaymentPage({ player, onComplete }) {
  const [utr, setUtr] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload a JPG, PNG, or other image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Your image must be smaller than 8 MB.'); return; }
    setError('');
    const url = URL.createObjectURL(file);
    setImage({ file, url });
  };
  useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url); }, [image?.url]);
  const submit = (event) => {
    event.preventDefault(); setError('');
    if (!utr.trim()) return setError('Enter the UTR / transaction reference number.');
    if (!image) return setError('Upload a screenshot of your payment to continue.');
    setBusy(true);
    const submission = { player, utr: utr.trim(), receiptName: image.file.name, submittedAt: new Date().toISOString(), status: 'Under review' };
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
    setTimeout(() => { onComplete(submission); setBusy(false); }, 250);
  };
  return <section className="payment-panel">
    <div className="panel-overline"><span className="overline-mark"><ShieldCheck size={14} /></span> SECURE PAYMENT <span className="overline-line" /></div>
    <h1 className="section-title">One last step.<br /><span>Make it count.</span></h1>
    <p className="section-intro">Scan the tournament QR, then share your transaction details below.</p>
    <div className="payment-layout">
      <div className="payment-left">
        <div className="qr-card"><div className="qr-head"><span className="qr-heading">SCAN TO PAY</span><span className="qr-secure"><LockKeyhole size={12} /> SECURE</span></div><QRPlaceholder /><p className="qr-caption">Payment QR code is being set up by the tournament organizer.</p></div>
        <div className="holder-card"><span className="holder-icon"><UserRound size={16} /></span><span><small>ACCOUNT HOLDER</small><b>Organizer name will be shown here</b></span><CircleHelp size={15} className="holder-help" /></div>
      </div>
      <form className="payment-form" onSubmit={submit} noValidate>
        <div className="payment-form-title"><span>PAYMENT DETAILS</span><span className="required-tag">ALL FIELDS REQUIRED</span></div>
        <label className="field"><span>Enter UTR number <i>*</i></span><div className="input-wrap"><input autoComplete="off" placeholder="12-digit transaction reference" value={utr} onChange={(event) => setUtr(event.target.value)} /></div><small className="field-hint">You can find this in your payment app receipt.</small></label>
        <div className="field"><span>Upload payment image <i>*</i></span>
          <input ref={inputRef} type="file" accept="image/*" className="visually-hidden" onChange={handleImage} />
          <button type="button" className={`upload-box ${image ? 'has-file' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file && inputRef.current) { const transfer = new DataTransfer(); transfer.items.add(file); inputRef.current.files = transfer.files; inputRef.current.dispatchEvent(new Event('change', { bubbles: true })); } }}>
            {image ? <><img src={image.url} alt="Payment receipt preview" /><span className="upload-preview-label"><CheckCircle2 size={14} /> {image.file.name}</span><span className="replace-file">Change</span></> : <><span className="upload-icon"><ImagePlus size={19} /></span><b>Choose a screenshot</b><small>JPG or PNG · Max 8 MB</small><span className="browse-label">Browse files <Upload size={13} /></span></>}
          </button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary complete-button" disabled={busy}>{busy ? 'Submitting…' : 'Complete registration'}<ArrowRight size={17} /></button>
        <p className="form-note"><ShieldCheck size={14} /> Payment proof is submitted securely for verification.</p>
      </form>
    </div>
    <div className="payment-back"><Link to="/join"><ArrowLeft size={14} /> Back to player details</Link><span>ENTRY FOR <b>{player?.name || 'PLAYER'}</b></span></div>
  </section>;
}

function SuccessModal({ onClose, onView }) {
  useEffect(() => {
    const handleKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', handleKey); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <div className="success-graphic"><span className="success-halo" /><span className="success-check"><Check size={31} strokeWidth={2.7} /></span><Sparkles className="spark spark-one" size={18} /><Sparkles className="spark spark-two" size={13} /></div>
      <span className="success-eyebrow"><span /> ENTRY RECEIVED <span /></span>
      <h2 id="success-title">You’re on<br /><span>the roster.</span></h2>
      <p>Your tournament joining form has been submitted successfully. Our team will verify your details and payment. You should appear on the tournament list within a few minutes.</p>
      <div className="review-note"><Clock3 size={16} /><span><b>What happens next?</b><small>We’ll review your entry and update your registration status.</small></span></div>
      <button className="button button-primary modal-view" onClick={onView}>View registration status <ArrowRight size={17} /></button>
      <button className="modal-later" onClick={onClose}>I’ll check back later</button>
      <span className="modal-id">ZPLAY · TOURNAMENT ENTRY</span>
    </section>
  </div>;
}

function TournamentStatus({ submission }) {
  if (!submission) return <Navigate to="/join" replace />;
  return <section className="status-panel">
    <div className="panel-overline"><span className="overline-mark"><Trophy size={14} /></span> TOURNAMENT REGISTER <span className="overline-line" /></div>
    <div className="status-emblem"><Trophy size={29} /></div>
    <span className="status-kicker">REGISTRATION STATUS</span>
    <h1 className="section-title status-title">Your entry is<br /><span>under review.</span></h1>
    <p className="section-intro status-intro">Your joining form is in. We’re verifying your payment and player details now. Check back here in a few minutes.</p>
    <div className="status-card"><div className="status-card-top"><span>PLAYER ENTRY</span><span className="review-badge"><span /> UNDER REVIEW</span></div><div className="status-player"><span className="status-avatar">{(submission.player?.name || 'P').slice(0, 1).toUpperCase()}</span><div><b>{submission.player?.name || 'Player'}</b><small>UID {submission.player?.gameUid || '—'} · Level {submission.player?.gameLevel || '—'}</small></div><CheckCircle2 size={19} className="status-check" /></div><div className="status-divider" /><div className="status-details"><span>UTR reference</span><b>{submission.utr}</b><span>Submitted</span><b>{new Date(submission.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></div></div>
    <Link to="/join" className="button button-secondary status-back"><ArrowLeft size={16} /> Back to join page</Link>
    <div className="support-hint"><Headphones size={15} /> Need help? Contact the tournament organizer.</div>
  </section>;
}

function App() {
  const [account, setAccount] = useState(() => readJson(ACCOUNT_KEY));
  const [player, setPlayer] = useState(() => readJson(PROFILE_KEY));
  const [submission, setSubmission] = useState(() => readJson(SUBMISSION_KEY));
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeStep = location.pathname === '/payment' ? 2 : location.pathname === '/tournaments' ? 3 : 1;
  const signOut = () => {
    localStorage.removeItem(ACCOUNT_KEY); setAccount(null); navigate('/join');
  };
  const closeModal = () => setShowSuccess(false);
  const complete = (data) => { setSubmission(data); setShowSuccess(true); };
  const openStatus = () => { setShowSuccess(false); navigate('/tournaments'); };

  return <div className="app-shell">
    <Header account={account} onSignOut={signOut} />
    <main className="page-wrap">
      <div className="page-topline"><div className="breadcrumb"><span>HOME</span><ChevronRight size={12} /><b>{location.pathname === '/payment' ? 'PAYMENT' : location.pathname === '/tournaments' ? 'REGISTRATION STATUS' : 'JOIN TOURNAMENT'}</b></div><span className="topline-right"><span className="online-pulse" /> ZPLAY ARENA <i>·</i> SEASON 01</span></div>
      {location.pathname !== '/tournaments' && <StepBar active={activeStep} />}
      <div className={`main-grid ${location.pathname === '/tournaments' ? 'status-grid' : ''}`}>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/join" replace />} />
            <Route path="/join" element={account ? <PlayerDetails account={account} onContinue={(data) => { setPlayer(data); navigate('/payment'); }} /> : <AuthPanel onSuccess={(value) => { setAccount(value); setPlayer({ name: value.name, mobile: value.mobile, email: '', gameUid: '', gameLevel: '' }); }} />} />
            <Route path="/payment" element={account && player?.gameUid ? <PaymentPage player={player} onComplete={complete} /> : <Navigate to="/join" replace />} />
            <Route path="/tournaments" element={<TournamentStatus submission={submission} />} />
            <Route path="*" element={<Navigate to="/join" replace />} />
          </Routes>
        </div>
        <TournamentCard />
      </div>
      <footer className="site-footer"><Brand compact /><span>Play with skill. Win with respect.</span><div className="footer-right"><span><ShieldCheck size={13} /> Fair play, always</span><span className="footer-copy">© 2025 ZPLAY ESPORTS</span></div></footer>
    </main>
    {showSuccess && <SuccessModal onClose={closeModal} onView={openStatus} />}
  </div>;
}

export default App;
