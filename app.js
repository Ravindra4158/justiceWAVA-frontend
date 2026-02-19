'use strict';

/* ============================================================
   JusticeVAWA — Frontend JavaScript
   All event listeners, form handling, FAQ, donate, scroll spy
   ============================================================ */

/* ---- API Base URL ---- */
// In production this will be same-origin (served by Express)
// In development, open index.html via the server: http://localhost:3000
const API = 'https://justicewava.onrender.com';

/* ---- Mobile Menu ---- */
function toggleMobile() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}
function closeMobile() {
    document.getElementById('mobile-menu').classList.add('hidden');
}

/* ---- Active Nav on Scroll (IntersectionObserver) ---- */
function initScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
}

/* ---- FAQ Accordion ---- */
function toggleFAQ(btn) {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

/* ---- Child Count Toggle ---- */
function toggleChildCount(show) {
    document.getElementById('fg-child-count').classList.toggle('hidden', !show);
    document.querySelectorAll('input[name="children"]').forEach(r => {
        r.closest('.radio-opt').classList.remove('selected');
    });
    const active = show
        ? document.querySelector('input[name="children"][value="yes"]')
        : document.querySelector('input[name="children"][value="no"]');
    active?.closest('.radio-opt').classList.add('selected');
}

/* ---- Radio / Checkbox Visual Feedback ---- */
function initFormInteractions() {
    document.querySelectorAll('.radio-opt input[type=radio]').forEach(radio => {
        radio.addEventListener('change', function () {
            document.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
                r.closest('.radio-opt').classList.remove('selected');
            });
            this.closest('.radio-opt').classList.add('selected');
        });
    });
    document.querySelectorAll('.check-opt input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', function () {
            this.closest('.check-opt').classList.toggle('selected', this.checked);
        });
    });
}

/* ---- Validation Helpers ---- */
function vField(groupId, inputId, condition) {
    const fg = document.getElementById(groupId);
    const inp = document.getElementById(inputId);
    if (!condition) {
        fg?.classList.add('has-error');
        inp?.classList.add('error');
        return false;
    }
    fg?.classList.remove('has-error');
    inp?.classList.remove('error');
    return true;
}
function vRadio(groupId, name) {
    const fg = document.getElementById(groupId);
    const ok = !!document.querySelector(`input[name="${name}"]:checked`);
    fg?.classList.toggle('has-error', !ok);
    return ok;
}
function val(id) {
    return (document.getElementById(id)?.value || '').trim();
}

/* ---- Submit Button Loading State ---- */
function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.dataset.original = btn.dataset.original || btn.innerHTML;
    btn.innerHTML = loading
        ? '<span style="display:inline-flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Sending...</span>'
        : btn.dataset.original;
}

/* ---- Show inline API error ---- */
function showApiError(wrapId, msg) {
    const existing = document.getElementById('api-error-' + wrapId);
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'api-error-' + wrapId;
    div.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #E63946;border-radius:8px;padding:12px 16px;color:#E63946;font-size:0.88rem;font-weight:600;margin-bottom:16px';
    div.textContent = '⚠️ ' + msg;
    const wrap = document.getElementById(wrapId);
    wrap?.prepend(div);
}

/* ============================================================
   APPLY FORM
   ============================================================ */
function initApplyForm() {
    const form = document.getElementById('apply-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        /* --- Validate --- */
        const valid = [
            vField('fg-name', 'f-name', val('f-name').length > 1),
            vField('fg-phone', 'f-phone', val('f-phone').length > 6),
            vField('fg-location', 'f-location', val('f-location').length > 2),
            vField('fg-situation', 'f-situation', val('f-situation').length > 10),
            vRadio('fg-danger', 'danger'),
            vRadio('fg-abuser', 'abuser'),
            vRadio('fg-children', 'children'),
            vRadio('fg-contact-pref', 'contact_pref'),
        ].every(Boolean);

        const hasKids = document.querySelector('input[name="children"]:checked')?.value === 'yes';
        const kidsOk = hasKids ? vField('fg-child-count', 'f-child-count', parseInt(val('f-child-count')) > 0) : true;
        const consentEl = document.getElementById('f-consent');
        const consentOk = consentEl?.checked;
        document.getElementById('fg-consent')?.classList.toggle('has-error', !consentOk);

        if (!valid || !kidsOk || !consentOk) {
            document.getElementById('apply-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        /* --- Collect data --- */
        const supportTypes = [...document.querySelectorAll('#apply-form .check-opt input:checked')]
            .map(cb => cb.value);

        const payload = {
            name: val('f-name'),
            phone: val('f-phone'),
            email: val('f-email'),
            location: val('f-location'),
            danger: document.querySelector('input[name="danger"]:checked')?.value,
            abuser: document.querySelector('input[name="abuser"]:checked')?.value,
            children: document.querySelector('input[name="children"]:checked')?.value,
            childCount: val('f-child-count') || '0',
            supportTypes,
            situation: val('f-situation'),
            contactPref: document.querySelector('input[name="contact_pref"]:checked')?.value,
            consent: 'true'
        };

        /* --- Submit --- */
        const btn = form.querySelector('[type=submit]');
        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/api/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                document.getElementById('apply-form-wrap').innerHTML = `
          <div class="success-msg">
            <div class="check-icon">✅</div>
            <h3>Application Submitted</h3>
            <p>Thank you — our team will contact you within <strong>24 hours</strong>.<br><br>
            For urgent help call <strong>(951) 963-0467</strong> or the National DV Hotline at <strong>1-800-799-7233</strong>.</p>
          </div>`;
            } else {
                setLoading(btn, false);
                showApiError('apply-form-wrap', json.message || 'Submission failed. Please try again.');
            }
        } catch {
            setLoading(btn, false);
            showApiError('apply-form-wrap', 'Network error. Please call us at (951) 963-0467.');
        }
    });
}

/* ============================================================
   VOLUNTEER FORM
   ============================================================ */
function initVolunteerForm() {
    const form = document.getElementById('vol-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const valid = [
            vField('fg-vname', 'v-name', val('v-name').length > 1),
            vField('fg-vemail', 'v-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('v-email'))),
            vField('fg-vphone', 'v-phone', val('v-phone').length > 6),
        ].every(Boolean);
        if (!valid) return;

        const roles = [...document.querySelectorAll('#vol-form .check-opt input:checked')]
            .map(cb => cb.closest('.check-opt').textContent.trim());

        const payload = {
            name: val('v-name'),
            email: val('v-email'),
            phone: val('v-phone'),
            city: document.querySelector('#vol-form input[placeholder*="City"]')?.value?.trim() || '',
            roles,
            bio: document.querySelector('#vol-form textarea')?.value?.trim() || ''
        };

        const btn = form.querySelector('[type=submit]');
        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/api/volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                document.getElementById('vol-form-wrap').innerHTML = `
          <div class="success-msg">
            <div class="check-icon">🙏</div>
            <h3>Thank You for Volunteering!</h3>
            <p>We received your application and will reach out within <strong>2–3 business days</strong>.<br><br>
            Questions? Email <strong>info@justicevawa.com</strong></p>
          </div>`;
            } else {
                setLoading(btn, false);
                showApiError('vol-form-wrap', json.message || 'Submission failed. Please try again.');
            }
        } catch {
            setLoading(btn, false);
            showApiError('vol-form-wrap', 'Network error. Please email info@justicevawa.com.');
        }
    });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const valid = [
            vField('fg-cname', 'c-name', val('c-name').length > 1),
            vField('fg-cemail', 'c-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('c-email'))),
            vField('fg-csubject', 'c-subject', val('c-subject') !== ''),
            vField('fg-cmessage', 'c-message', val('c-message').length > 5),
        ].every(Boolean);
        if (!valid) return;

        const payload = {
            name: val('c-name'),
            email: val('c-email'),
            phone: document.querySelector('#contact-form input[type=tel]')?.value?.trim() || '',
            subject: val('c-subject'),
            message: val('c-message')
        };

        const btn = form.querySelector('[type=submit]');
        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                document.getElementById('contact-form-wrap').innerHTML = `
          <div class="success-msg">
            <div class="check-icon">📨</div>
            <h3>Message Sent!</h3>
            <p>Thank you for reaching out. We will respond within <strong>24 hours</strong>.<br><br>
            For urgent matters call <strong>(951) 963-0467</strong></p>
          </div>`;
            } else {
                setLoading(btn, false);
                showApiError('contact-form-wrap', json.message || 'Submission failed. Please try again.');
            }
        } catch {
            setLoading(btn, false);
            showApiError('contact-form-wrap', 'Network error. Please call (951) 963-0467.');
        }
    });
}

/* ============================================================
   DONATE
   ============================================================ */
function setAmount(btn) {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('custom-amount').value = '';
}
function handleDonate() {
    const custom = document.getElementById('custom-amount')?.value;
    const preset = document.querySelector('.amount-btn.active')?.dataset.amount;
    const amount = custom || preset || '100';
    // TODO: Replace with Stripe/PayPal redirect
    alert(`Thank you for your generous donation of $${amount}!\n\nYou'll be redirected to our secure payment processor.\nContact info@justicevawa.com with any questions.`);
}

/* ============================================================
   INIT — DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initScrollSpy();
    initFormInteractions();
    initApplyForm();
    initVolunteerForm();
    initContactForm();

    // Donate: custom amount clears preset selection
    document.getElementById('custom-amount')?.addEventListener('focus', () => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    });

    // Mobile menu: close on link click
    document.querySelectorAll('.mobile-menu a').forEach(a => {
        a.addEventListener('click', closeMobile);
    });
});

/* ---- Spin keyframe for loading spinner ---- */
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
