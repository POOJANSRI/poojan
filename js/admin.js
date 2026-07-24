// --- SECURITY BOUNCER ---
if (localStorage.getItem("acseAdminLoggedIn") !== "true") {
    window.location.href = "login.html";
}

function logoutAdmin() {
    localStorage.removeItem("acseAdminLoggedIn"); 
    window.location.href = "login.html"; 
}

// --- Google Sheets Config ---
// Submissions are now read from Google Sheets (no Firebase needed)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo0p_m9pmN69gUq_gii2iVW5QrPnL-yf4toZ1wAn6vkceTUO_WZi_LQoZGMr5GWzhEf0iOqPicEZCj/pub?output=csv&gid=2034120706';

// Apps Script URL for delete action
const ADMIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMi6KQs0Ye7-RPnOWei54M0-I90cnuDGyOucTnKB4LM9tcnZY7EkyebnzHqsr6wMuX/exec';

// Column indices matching the Apps Script output
const SCOL = { date:0, type:1, name:2, regNo:3, contact:4, event:5, role:6, year:7, branch:8, section:9, otherCollege:10, collegeName:11, certLink:12 };

// CSV parser
function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        const cols = []; let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
            else { cur += ch; }
        }
        cols.push(cur);
        rows.push(cols.map(c => c.replace(/^"|"$/g, '').trim()));
    }
    return rows;
}

// Stub db object so existing Firebase calls fail silently instead of crashing
const db = { collection: () => ({ doc: () => ({ get: () => Promise.resolve({exists: false, data: () => ({})}), set: () => Promise.resolve(), update: () => Promise.resolve() }), add: () => Promise.resolve({id:''}), orderBy: () => ({ get: () => Promise.resolve({empty:true, forEach:()=>{}}) }) }) };

// --- Portal Card Defaults ---
const portalCardDefaults = {
    "competitive-exams": { title: "Competitive Exams", subtitle: "GATE, GRE, CAT, GMAT, IELTS", description: "Qualified in a competitive exam? Submit your rank or score along with your rank certificate (PDF, Max 1MB)." },
    "generic-cocurricular-card": { title: "Co-curricular (General)", subtitle: "Hackathons, Papers, Expos", description: "Participated in a Hackathon, Ideathon, or Project Expo? Submit it here." },
    "nptel-card": { title: "NPTEL Online Courses", subtitle: "Elite Silver, Gold, Topper", description: "Completed an NPTEL certification course? Submit your elite certificate here." },
    "extra-curricular-card": { title: "Extra-curricular", subtitle: "Sports, Games, Cultural", description: "Participated in sports, cultural fests, or games at university/state level? Submit your certificate here." },
    "administrative-card": { title: "Admin & Leadership", subtitle: "Class Rep, Committees, NCC", description: "Were you part of a student body, committee, NCC, or held a leadership role? Submit your details." },
    "academic-card": { title: "Other Academic", subtitle: "Internships, Papers, Grants", description: "Completed a funded project, published a paper, or finished an internship? Submit your proof here." }
};

// --- Load Events (Default + Custom) ---
async function loadAdminEvents() {
    const coCurricularList = document.getElementById('admin-cocurricular-list');
    const curricularList = document.getElementById('admin-curricular-list');

    if (!coCurricularList || !curricularList) return;

    coCurricularList.innerHTML = '<li style="color:var(--text-muted); font-style:italic;">Loading...</li>';
    curricularList.innerHTML = '<li style="color:var(--text-muted); font-style:italic;">Loading...</li>';

    try {
        // 1. Fetch Default Category Config
        const configSnap = await db.collection('settings').doc('portal_cards').get();
        let configData = {};
        if (configSnap.exists) {
            configData = configSnap.data();
        } else {
            // Automatically seed default categories to Firebase
            await db.collection('settings').doc('portal_cards').set(portalCardDefaults);
            configData = portalCardDefaults;
            console.log("Successfully seeded default portal categories to Firebase.");
        }

        // 2. Fetch Custom Events
        const customEventsSnap = await db.collection('events').orderBy('createdAt', 'desc').get();

        coCurricularList.innerHTML = '';
        curricularList.innerHTML = '';

        // Render Default Categories
        const coCurricularIds = ['generic-cocurricular-card', 'extra-curricular-card', 'administrative-card'];
        const curricularIds = ['competitive-exams', 'nptel-card', 'academic-card'];

        // Color map for each card ID
        const cardColors = {
            'generic-cocurricular-card': { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', border: 'rgba(16,185,129,0.3)' },
            'extra-curricular-card':     { bg: 'rgba(236,72,153,0.12)',  text: '#ec4899', border: 'rgba(236,72,153,0.3)' },
            'administrative-card':       { bg: 'rgba(14,165,233,0.12)',  text: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
            'competitive-exams':         { bg: 'rgba(234,88,12,0.12)',   text: '#ea580c', border: 'rgba(234,88,12,0.3)' },
            'nptel-card':                { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
            'academic-card':             { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
        };

        const renderDefault = (id, defaultIcon) => {
            const title = configData[id]?.title || portalCardDefaults[id].title;
            const subtitle = configData[id]?.subtitle || portalCardDefaults[id].subtitle;
            const desc = configData[id]?.description || portalCardDefaults[id].description;
            const c = cardColors[id] || { bg: 'rgba(79,70,229,0.1)', text: 'var(--primary)', border: 'rgba(79,70,229,0.25)' };
            const safeTitle = title.replace(/`/g, '').replace(/'/g, "\\'");
            const safeSubtitle = subtitle.replace(/`/g, '').replace(/'/g, "\\'");
            const safeDesc = desc.replace(/`/g, '').replace(/'/g, "\\'");
            return `<li style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;background:#fff;border:1.5px solid ${c.border};border-radius:14px;padding:0.85rem 1rem;margin-bottom:0.65rem;box-shadow:0 2px 10px rgba(0,0,0,0.04);list-style:none;transition:box-shadow 0.2s,transform 0.2s;" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.09)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.04)';this.style.transform='translateY(0)'">
                <div style="display:flex;align-items:center;gap:0.8rem;flex:1;min-width:0;">
                    <div style="width:42px;height:42px;min-width:42px;background:${c.bg};color:${c.text};border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:1.05rem;">${defaultIcon}</div>
                    <div style="min-width:0;">
                        <div style="font-size:0.875rem;font-weight:700;color:#1e293b;line-height:1.3;">${title}</div>
                        <div style="font-size:0.72rem;color:#94a3b8;margin-top:3px;font-weight:500;">${subtitle}</div>
                    </div>
                </div>
                <button onclick="openEditModal('${id}','${safeTitle}','${safeSubtitle}','${safeDesc}')" style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;font-weight:700;background:${c.bg};color:${c.text};padding:0.38rem 0.8rem;border:1.5px solid ${c.border};border-radius:8px;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;" onmouseover="this.style.opacity='0.75'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-pen" style="font-size:0.62rem;"></i> Edit</button>
            </li>`;
        };

        coCurricularIds.forEach(id => {
            let icon = '<i class="fa-solid fa-laptop-code"></i>';
            if(id === 'extra-curricular-card') icon = '<i class="fa-solid fa-masks-theater"></i>';
            if(id === 'administrative-card') icon = '<i class="fa-solid fa-users-gear"></i>';
            coCurricularList.innerHTML += renderDefault(id, icon);
        });

        curricularIds.forEach(id => {
            let icon = '<i class="fa-solid fa-file-contract"></i>';
            if(id === 'nptel-card') icon = '<i class="fa-solid fa-graduation-cap"></i>';
            if(id === 'academic-card') icon = '<i class="fa-solid fa-briefcase"></i>';
            curricularList.innerHTML += renderDefault(id, icon);
        });

        // Render Custom Events
        customEventsSnap.forEach(doc => {
            const e = doc.data();
            const id = doc.id;
            const cat = e.category || 'cocurricular';
            const iconHtml = e.icon || '<i class="fa-solid fa-star"></i>';
            const safeName = (e.name || '').replace(/'/g, "\\'");
            const safeDate = (e.date || '').replace(/'/g, "\\'");
            const safeDetails = (e.details || '').replace(/'/g, "\\'");
            const safeDesc = (e.description || '').replace(/'/g, "\\'");
            const safeCategory = (e.category || 'cocurricular');

            const html = `<li style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;background:#fff;border:1.5px solid rgba(245,158,11,0.35);border-radius:14px;padding:0.85rem 1rem;margin-bottom:0.65rem;box-shadow:0 2px 10px rgba(0,0,0,0.04);list-style:none;transition:box-shadow 0.2s,transform 0.2s;" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.09)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.04)';this.style.transform='translateY(0)'">
                <div style="display:flex;align-items:center;gap:0.8rem;flex:1;min-width:0;">
                    <div style="width:42px;height:42px;min-width:42px;background:rgba(245,158,11,0.12);color:#f59e0b;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:1.05rem;">${iconHtml}</div>
                    <div style="min-width:0;">
                        <div style="font-size:0.875rem;font-weight:700;color:#1e293b;line-height:1.3;">${e.name}</div>
                        <div style="font-size:0.72rem;color:#94a3b8;margin-top:3px;font-weight:500;">${e.date || 'No Date'} · ${e.details || 'Custom Event'}</div>
                    </div>
                </div>
                <div style="display:flex;gap:0.4rem;">
                    <button onclick="openEditEventModal('${id}','${safeName}','${safeCategory}','${safeDate}','${safeDetails}','${safeDesc}')" style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;font-weight:700;background:rgba(245,158,11,0.12);color:#f59e0b;padding:0.38rem 0.8rem;border:1.5px solid rgba(245,158,11,0.35);border-radius:8px;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;" onmouseover="this.style.opacity='0.75'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-pen" style="font-size:0.62rem;"></i> Edit</button>
                    <button onclick="deleteEvent('${id}')" style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;font-weight:700;background:rgba(239,68,68,0.1);color:#ef4444;padding:0.38rem 0.8rem;border:1.5px solid rgba(239,68,68,0.25);border-radius:8px;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;" onmouseover="this.style.opacity='0.75'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-trash" style="font-size:0.62rem;"></i> Delete</button>
                </div>
            </li>`;

            if (cat === 'cocurricular') {
                coCurricularList.innerHTML += html;
            } else {
                curricularList.innerHTML += html;
            }
        });

        
    } catch (e) {
        console.error("Failed to load activities list:", e);
        if (coCurricularList) coCurricularList.innerHTML = `<li style="color:var(--red); font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${e.code === 'permission-denied' ? 'Firebase rules need updating — see instructions above.' : 'Error loading. Check console.'}</li>`;
        if (curricularList) curricularList.innerHTML = `<li style="color:var(--red); font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${e.code === 'permission-denied' ? 'Firebase rules need updating.' : 'Error loading.'}</li>`;
    }
}

// --- Seed Default Activities into Firestore ---
async function seedDefaultActivities() {
    const btn = document.getElementById('seed-defaults-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        await db.collection('settings').doc('portal_cards').set(portalCardDefaults);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Done!';
        btn.style.background = 'rgba(16,185,129,0.1)';
        btn.style.color = '#10b981';
        btn.style.borderColor = 'rgba(16,185,129,0.2)';
        loadAdminEvents();
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            btn.disabled = false;
        }, 2500);
    } catch(e) {
        handleFirebaseError(e, "seeding defaults");
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// --- Edit Custom Event Modal ---
let editingEventId = null;

function openEditEventModal(id, name, category, date, details, description) {
    editingEventId = id;
    document.getElementById('edit-event-id').value = id;
    document.getElementById('edit-event-name').value = name || '';
    document.getElementById('edit-event-category').value = category || 'cocurricular';
    document.getElementById('edit-event-date').value = date || '';
    document.getElementById('edit-event-details').value = details || '';
    document.getElementById('edit-event-desc').value = description || '';
    document.getElementById('edit-event-modal').style.display = 'flex';
}

document.getElementById('edit-event-modal')?.querySelector('.close-edit-event-btn')?.addEventListener('click', () => {
    document.getElementById('edit-event-modal').style.display = 'none';
});

document.getElementById('edit-event-form-inner')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-event-save-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('edit-event-id').value;
        await db.collection('events').doc(id).update({
            name: document.getElementById('edit-event-name').value,
            category: document.getElementById('edit-event-category').value,
            date: document.getElementById('edit-event-date').value,
            details: document.getElementById('edit-event-details').value,
            description: document.getElementById('edit-event-desc').value,
        });
        document.getElementById('edit-event-modal').style.display = 'none';
        loadAdminEvents();
    } catch(err) {
        console.error(err);
        alert('Failed to save: ' + err.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

// --- Load Submissions from Google Sheets ---
async function loadSubmissions() {
    const tableBody = document.getElementById('submissions-table-body');
    const countEl = document.getElementById('search-count');
    // colspan=6 because there are 6 columns: Name, RegNo, Activity, Year/Branch, Document, Delete
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px;"></i>Loading submissions from Google Sheets...</td></tr>';

    try {
        // Force fresh fetch — bypass browser cache
        const res = await fetch(SHEET_CSV_URL + '&t=' + Date.now(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Could not fetch sheet data. Make sure the sheet is published (File → Share → Publish to web → CSV).`);
        const text = await res.text();

        // Show raw debug info in console
        console.log('[Admin] Raw CSV first line:', text.split('\n')[0]);
        console.log('[Admin] Total CSV length:', text.length, 'chars,', text.split('\n').length, 'lines');

        let rows = parseCSV(text);
        console.log('[Admin] Parsed rows (before header strip):', rows.length);

        // Remove header row
        if (rows.length > 0 && (rows[0][0] || '').toLowerCase().includes('submitted')) {
            rows = rows.slice(1);
        }
        console.log('[Admin] Data rows after header strip:', rows.length);

        tableBody.innerHTML = '';

        if (rows.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">📭 No certificates submitted yet. If you just submitted one, wait 1–2 minutes for Google Sheets to update, then click Refresh.</td></tr>';
            if (countEl) countEl.textContent = 'Showing 0 participants';
            // Still update timestamp
            const lastUpdatedEl = document.getElementById('last-updated-label');
            if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            return;
        }

        if (countEl) countEl.textContent = `Showing ${rows.length} participant${rows.length !== 1 ? 's' : ''}`;

        // Update last-refreshed timestamp
        const lastUpdatedEl = document.getElementById('last-updated-label');
        if (lastUpdatedEl) {
            const now = new Date();
            lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }

        // Sort newest first (row 0 = oldest since Sheets appends)
        rows.reverse();

        rows.forEach(row => {
            const name     = row[SCOL.name]     || '—';
            const regNo    = row[SCOL.regNo]    || '—';
            const contact  = row[SCOL.contact]  || '';
            const event    = row[SCOL.event]    || '—';
            const role     = row[SCOL.role]     || '';
            const year     = row[SCOL.year]     || '';
            const branch   = row[SCOL.branch]   || '';
            const section  = row[SCOL.section]  || '';
            const certLink = row[SCOL.certLink] || '';

            const certLinkSafe = certLink.replace(/'/g, '%27');

            const tr = document.createElement('tr');
            tr.style.borderBottom = 'var(--panel-border)';
            tr.innerHTML = `
                <td style="padding:10px;">${name}</td>
                <td style="padding:10px;">
                    ${regNo}
                    ${contact ? `<div style="font-size:0.8rem;color:var(--text-light);margin-top:4px;"><i class="fa-solid fa-phone"></i> ${contact}</div>` : ''}
                </td>
                <td style="padding:10px;">
                    ${event}
                    ${role ? `<div style="font-size:0.8rem;color:var(--primary);margin-top:4px;font-weight:600;">Role: ${role}</div>` : ''}
                </td>
                <td style="padding:10px;">${year} ${branch} ${section ? '(' + section + ')' : ''}</td>
                <td style="padding:10px;">
                    ${certLink
                        ? `<a href="${certLink}" target="_blank" style="color:var(--accent-secondary);text-decoration:none;font-weight:bold;border-bottom:1px solid;">View Cert &#x2197;</a>`
                        : '<span style="color:var(--text-light);font-size:0.8rem;">No file</span>'}
                </td>
                <td style="padding:10px;">
                    <button onclick="deleteSubmission('${certLinkSafe}', this)" title="Permanently delete this submission and PDF"
                        style="display:inline-flex;align-items:center;gap:0.3rem;background:rgba(239,68,68,0.1);color:#ef4444;border:1.5px solid rgba(239,68,68,0.3);border-radius:8px;padding:0.35rem 0.7rem;font-size:0.75rem;font-weight:700;cursor:pointer;transition:all 0.2s;"
                        onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('[Admin] loadSubmissions error:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">⚠️ ${error.message}<br><small style="color:var(--text-muted);margin-top:8px;display:block;">Check browser console (F12) for details. Click Refresh to try again.</small></td></tr>`;
    }
}

// --- Manual Refresh Button for Submissions ---
async function refreshSubmissions() {
    const btn = document.getElementById('refresh-submissions-btn');
    const icon = document.getElementById('refresh-icon');
    if (btn) btn.disabled = true;
    if (icon) icon.classList.add('fa-spin');
    await loadSubmissions();
    if (btn) btn.disabled = false;
    if (icon) icon.classList.remove('fa-spin');
}

// Auto-refresh every 60 seconds
setInterval(loadSubmissions, 60000);

// --- Permanently Delete Submission (Sheets + Drive) ---
async function deleteSubmission(certLink, btnEl) {
    if (!confirm('⚠️ PERMANENT DELETE\n\nThis will:\n• Remove the row from ALL Google Sheets tabs\n• Delete the PDF from Google Drive\n\nThis CANNOT be undone. Are you sure?')) return;

    const originalHTML = btnEl.innerHTML;
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btnEl.style.opacity = '0.6';

    try {
        await fetch(ADMIN_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'delete', certLink: decodeURIComponent(certLink) })
        });

        // Fade out and remove the row from UI
        const row = btnEl.closest('tr');
        if (row) {
            row.style.transition = 'opacity 0.4s, transform 0.4s';
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
                const remaining = document.querySelectorAll('#submissions-table-body tr').length;
                const countEl = document.getElementById('search-count');
                if (countEl) countEl.textContent = `Showing ${remaining} participant${remaining !== 1 ? 's' : ''}`;
            }, 400);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Delete failed: ' + error.message);
        btnEl.innerHTML = originalHTML;
        btnEl.disabled = false;
        btnEl.style.opacity = '1';
    }
}


// --- Helper: More Descriptive Errors ---
function handleFirebaseError(error, action) {
    console.error(`Error during ${action}:`, error);
    
    if (error.code === 'permission-denied') {
        alert("CRITICAL ERROR: Permission Denied!\n\nYour Firebase Rules are blocking the website. Please go to the Firebase Console and update your Rules tab.");
    } else if (error.code === 'unavailable') {
        alert("CRITICAL ERROR: Connection Unreachable!\n\nYour internet might be disconnected or Firebase is currently unreachable.");
    } else {
        alert(`Error while ${action}: ` + error.message);
    }
}

// --- Live Search Filtering ---
const searchInput = document.getElementById('submission-search');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#submissions-table-body tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const name = row.cells[0]?.textContent.toLowerCase() || "";
            const regNo = row.cells[1]?.textContent.toLowerCase() || "";
            const eventAndRole = row.cells[2]?.textContent.toLowerCase() || "";
            
            // Only trigger if we're not in a "Loading..." or "No submissions" state
            if (row.cells.length > 1) {
                if (name.includes(term) || regNo.includes(term) || eventAndRole.includes(term)) {
                    row.style.display = "";
                    visibleCount++;
                } else {
                    row.style.display = "none";
                }
            }
        });
        
        const countEl = document.getElementById('search-count');
        if (countEl && rows[0]?.cells.length > 1) {
            countEl.textContent = `Showing ${visibleCount} participant${visibleCount === 1 ? '' : 's'}`;
        }
    });
}

// --- Edit Modal Logic ---
function openEditModal(id, title, subtitle, desc) {
    document.getElementById('edit-cat-id').value = id;
    document.getElementById('edit-cat-title').value = title;
    document.getElementById('edit-cat-subtitle').value = subtitle;
    document.getElementById('edit-cat-desc').value = desc;
    document.getElementById('edit-category-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-category-modal').style.display = 'none';
}

document.getElementById('edit-category-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-cat-save-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    btn.disabled = true;

    const id = document.getElementById('edit-cat-id').value;
    
    // Fetch current config to merge
    try {
        const docRef = db.collection('settings').doc('portal_cards');
        const docSnap = await docRef.get();
        let currentConfig = docSnap.exists ? docSnap.data() : {};
        
        currentConfig[id] = {
            title: document.getElementById('edit-cat-title').value,
            subtitle: document.getElementById('edit-cat-subtitle').value,
            description: document.getElementById('edit-cat-desc').value
        };
        
        await docRef.set(currentConfig);
        closeEditModal();
        loadAdminEvents();
    } catch(err) {
        handleFirebaseError(err, "saving config");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Add Custom Event ---
document.getElementById('add-event-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.querySelector('.add-event-btn');
    const name = document.getElementById('new-event-name').value.trim();
    const category = document.getElementById('new-event-category').value;
    const iconClass = document.getElementById('new-event-icon').value;
    const icon = iconClass === 'none' ? '' : `<i class="${iconClass}"></i>`;
    const desc = document.getElementById('new-event-desc')?.value.trim() || "";
    
    const startDateRaw = document.getElementById('new-event-start-date').value;
    const endDateRaw = document.getElementById('new-event-end-date').value;
    
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const startStr = formatDate(startDateRaw);
    const endStr = formatDate(endDateRaw);
    let dateStr = startStr;
    if (endStr && endStr !== startStr) {
        dateStr = `${startStr} - ${endStr}`;
    }
    
    const details = document.getElementById('new-event-details')?.value.trim() || "";
    if (!name || !startDateRaw) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Publishing...';

    try {
        await db.collection("events").add({
            name: name,
            category: category,
            icon: icon,
            description: desc,
            date: dateStr,
            details: details,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('add-event-form').reset();
        loadAdminEvents(); 
    } catch (error) {
        handleFirebaseError(error, "adding event");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Activity';
    }
});

// --- Delete Custom Event ---
async function deleteEvent(id) {
    if (!confirm("Are you sure you want to delete this custom activity?")) return;
    try {
        await db.collection("events").doc(id).delete();
        loadAdminEvents(); 
    } catch (error) {
        handleFirebaseError(error, "deleting event");
    }
}


// --- Initialize ---
loadAdminEvents();
loadSubmissions();