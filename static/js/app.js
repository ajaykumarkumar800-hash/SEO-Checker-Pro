/* ═══════════════════════════════════════════════
   SEO CHECKER PRO — Frontend Application v2
   80+ checks, 10 categories, radar chart, PDF
   ═══════════════════════════════════════════════ */

let currentReport = null;
let currentTab = "on_page";

/* ── ANALYSIS ── */

let loadingInterval = null;
let countdownInterval = null;

function startAnalysis() {
    const input = document.getElementById("urlInput");
    const url = input.value.trim();
    if (!url) { showError("Please enter a website URL."); input.focus(); return; }
    
    const keywordInput = document.getElementById("keywordInput");
    const keyword = keywordInput ? keywordInput.value.trim() : "";
    
    const categorySelect = document.getElementById("categorySelect");
    const category = categorySelect ? categorySelect.value : "general";
    
    hideError();
    setLoading(true);
    showSection("loading");
    animateLoadingSteps();

    fetch("/api/analyze", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
        },
        body: JSON.stringify({ url, keyword, website_category: category }),
    })
    .then(r => {
        if (r.status === 429) {
            showRateLimitOverlay();
            throw new Error("RATE_LIMIT_EXCEEDED");
        }
        return r.json();
    })
    .then(data => {
        if (data.success) {
            completeLoadingAnimation(() => {
                setLoading(false);
                currentReport = data;
                renderResults(data);
                showSection("results");
            });
        } else {
            clearIntervals();
            setLoading(false);
            showSection("hero");
            showError(data.error || "Analysis failed.");
        }
    })
    .catch(err => {
        if (err.message === "RATE_LIMIT_EXCEEDED") return;
        clearIntervals();
        setLoading(false);
        showSection("hero");
        showError("Network error. Please check your connection.");
    });
}

function clearIntervals() {
    if (loadingInterval) clearInterval(loadingInterval);
    if (countdownInterval) clearInterval(countdownInterval);
}

document.getElementById("urlInput").addEventListener("keydown", e => {
    if (e.key === "Enter") startAnalysis();
});

document.addEventListener("DOMContentLoaded", () => {
    const keywordInput = document.getElementById("keywordInput");
    if (keywordInput) {
        keywordInput.addEventListener("keydown", e => {
            if (e.key === "Enter") startAnalysis();
        });
    }
});

/* ── UI STATE ── */

function showSection(s) {
    document.getElementById("hero").style.display = s === "hero" ? "" : "none";
    document.getElementById("loadingSection").style.display = s === "loading" ? "" : "none";
    document.getElementById("resultsSection").style.display = s === "results" ? "" : "none";
    if (s === "results") window.scrollTo({ top: 0, behavior: "smooth" });
}

function setLoading(on) {
    const btn = document.getElementById("analyzeBtn");
    if (!btn) return;
    btn.disabled = on;
    const txt = btn.querySelector(".btn-text");
    if (txt) txt.textContent = on ? "Analyzing…" : "Analyze";
    const ldr = btn.querySelector(".btn-loader");
    if (ldr) ldr.style.display = on ? "inline-flex" : "none";
}

function showError(msg) { const el = document.getElementById("errorMsg"); el.textContent = msg; el.style.display = "block"; }
function hideError() { document.getElementById("errorMsg").style.display = "none"; }
function resetScan() {
    currentReport = null; currentTab = "on_page";
    document.getElementById("urlInput").value = "";
    const kw = document.getElementById("keywordInput");
    if (kw) kw.value = "";
    
    // Clear all tab scores and badges
    document.querySelectorAll(".tab-score").forEach(el => el.textContent = "");
    document.querySelectorAll(".tab-badge").forEach(el => {
        el.textContent = "";
        el.className = "tab-badge";
    });
    
    showSection("hero");
    document.getElementById("urlInput").focus();
}

/* ── LOADING ANIMATION ── */

function animateLoadingSteps() {
    const steps = document.querySelectorAll(".loading-step");
    const percentEl = document.getElementById("loadingPercent");
    const ringFill = document.querySelector(".loading-ring-fill");
    const countdownEl = document.getElementById("countdownSeconds");
    
    steps.forEach(s => s.className = "loading-step");
    
    if (ringFill) {
        ringFill.style.transition = "stroke-dashoffset 0.05s linear";
        ringFill.style.strokeDashoffset = "264";
    }
    
    let percent = 0;
    let secondsLeft = 30;
    const totalSteps = steps.length;
    
    if (countdownEl) countdownEl.textContent = secondsLeft;
    if (percentEl) percentEl.textContent = "0%";
    
    clearIntervals();
    
    // 1. Countdown timer interval (seconds remaining)
    countdownInterval = setInterval(() => {
        if (secondsLeft > 1) {
            secondsLeft--;
            if (countdownEl) countdownEl.textContent = secondsLeft;
        }
    }, 1000);
    
    // 2. Smooth fluid pseudo-progress bar logic at 50ms frequency
    loadingInterval = setInterval(() => {
        if (percent < 95) {
            percent += 0.16 + Math.random() * 0.08;
            if (percent > 95) percent = 95;
            
            const rounded = Math.round(percent);
            if (percentEl) percentEl.textContent = rounded + "%";
            
            if (ringFill) {
                const offset = 264 - (264 * rounded / 100);
                ringFill.style.strokeDashoffset = offset;
            }
            
            // Advance steps based on percentage boundaries
            let stepIndex = 0;
            if (percent >= 90) stepIndex = 6;
            else if (percent >= 75) stepIndex = 5;
            else if (percent >= 60) stepIndex = 4;
            else if (percent >= 45) stepIndex = 3;
            else if (percent >= 30) stepIndex = 2;
            else if (percent >= 15) stepIndex = 1;
            else stepIndex = 0;
            
            for (let idx = 0; idx < totalSteps; idx++) {
                if (idx < stepIndex) {
                    steps[idx].classList.remove("active");
                    steps[idx].classList.add("done");
                } else if (idx === stepIndex) {
                    steps[idx].classList.remove("done");
                    steps[idx].classList.add("active");
                } else {
                    steps[idx].classList.remove("active", "done");
                }
            }
        }
    }, 50);
}

function completeLoadingAnimation(callback) {
    clearIntervals();
    
    const percentEl = document.getElementById("loadingPercent");
    const ringFill = document.querySelector(".loading-ring-fill");
    const countdownEl = document.getElementById("countdownSeconds");
    const steps = document.querySelectorAll(".loading-step");
    
    let startPercent = 25;
    if (percentEl) {
        startPercent = parseInt(percentEl.textContent) || 25;
    }
    
    let startSeconds = 25;
    if (countdownEl) {
        startSeconds = parseInt(countdownEl.textContent) || 25;
    }
    
    const duration = 1200; // Smooth 1.2s ease-out to reach 100%
    const startTime = performance.now();
    
    if (ringFill) {
        ringFill.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.1, 0.76, 0.55, 0.94)`;
        ringFill.style.strokeDashoffset = "0";
    }
    
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Eased percentage calculation (cubic ease out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentPercent = Math.round(startPercent + (100 - startPercent) * easeProgress);
        const currentSeconds = Math.round(startSeconds * (1 - easeProgress));
        
        if (percentEl) percentEl.textContent = currentPercent + "%";
        if (countdownEl) countdownEl.textContent = currentSeconds;
        
        const totalSteps = steps.length;
        let stepIndex = 0;
        if (currentPercent >= 90) stepIndex = 6;
        else if (currentPercent >= 75) stepIndex = 5;
        else if (currentPercent >= 60) stepIndex = 4;
        else if (currentPercent >= 45) stepIndex = 3;
        else if (currentPercent >= 30) stepIndex = 2;
        else if (currentPercent >= 15) stepIndex = 1;
        else stepIndex = 0;
        
        for (let idx = 0; idx < totalSteps; idx++) {
            if (idx < stepIndex) {
                steps[idx].classList.remove("active");
                steps[idx].classList.add("done");
            } else if (idx === stepIndex) {
                steps[idx].classList.remove("done");
                steps[idx].classList.add("active");
            } else {
                steps[idx].classList.remove("active", "done");
            }
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            steps.forEach(s => {
                s.classList.remove("active");
                s.classList.add("done");
            });
            setTimeout(callback, 300);
        }
    }
    
    requestAnimationFrame(update);
}

/* ── RENDER RESULTS ── */

function renderResults(data) {
    renderScoreOverview(data);
    renderSerpPreview(data);
    renderOpenGraph(data);
    renderKeywordDensity(data);
    renderTechStack(data);
    renderPageSpeed(data);
    renderGSCDiagnostics(data);
    renderCategoryOverview(data.category_scores);
    renderRecommendations(data.recommendations);
    renderTabScores(data.category_scores);
    switchTab("on_page");
    setTimeout(() => {
        drawRadarChart(data.category_scores);
        buildPrintReport(data);
    }, 400);
    saveToHistory(data);
    checkAndTriggerClientSidePageSpeed(data);
}
function buildPrintReport(data) {
    try {
        const el = document.getElementById("printReport");
        if (!el) return;
        
        // Grab radar chart image to embed in PDF
        const radarCanvas = document.getElementById("radarChart");
        let radarImgHtml = "";
        if (radarCanvas) {
            try {
                const imgData = radarCanvas.toDataURL("image/png");
                radarImgHtml = `
                    <div style="text-align: center; margin: 20px 0; break-inside: avoid;">
                        <h4 style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Category Score Distribution</h4>
                        <img src="${imgData}" style="width: 240px; height: 240px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fff;" />
                    </div>
                `;
            } catch (canvasErr) {
                console.error("Error reading radar chart canvas for PDF:", canvasErr);
            }
        }
        
        let html = `
            <div class="print-header">
                <div class="print-title">SEO Checker Pro — Audit Report</div>
                <div class="print-score-box">
                    <div class="print-score-num">${data.overall_score || 0}/100</div>
                    <div style="font-size:11px;color:#64748b;font-weight:600;">Grade: ${data.grade || 'N/A'}</div>
                </div>
            </div>
            
            <div style="font-size:12px;color:#334155;margin-bottom:20px;word-break:break-all;">
                <strong>Analyzed URL:</strong> ${data.final_url || data.url || 'N/A'}<br>
                ${data.focus_keyword ? `<strong>Focus Keyword:</strong> ${data.focus_keyword}<br>` : ""}
                <strong>Scan Date:</strong> ${new Date().toLocaleString()}<br>
                <strong>Load Time:</strong> ${data.load_time || 0}s
            </div>
            
            <div class="print-meta-grid">
                <div class="print-meta-item">
                    <span class="print-meta-label">Total Checks</span>
                    <span class="print-meta-value">${(data.summary && data.summary.total_checks) || 0}</span>
                </div>
                <div class="print-meta-item">
                    <span class="print-meta-label">Passed</span>
                    <span class="print-meta-value" style="color:#10b981;">${(data.summary && data.summary.passed) || 0}</span>
                </div>
                <div class="print-meta-item">
                    <span class="print-meta-label">Warnings</span>
                    <span class="print-meta-value" style="color:#f59e0b;">${(data.summary && data.summary.warnings) || 0}</span>
                </div>
                <div class="print-meta-item">
                    <span class="print-meta-label">Failed</span>
                    <span class="print-meta-value" style="color:#ef4444;">${(data.summary && data.summary.failed) || 0}</span>
                </div>
                <div class="print-meta-item">
                    <span class="print-meta-label">Info</span>
                    <span class="print-meta-value" style="color:#3b82f6;">${(data.summary && data.summary.info) || 0}</span>
                </div>
                <div class="print-meta-item">
                    <span class="print-meta-label">Clean Grade</span>
                    <span class="print-meta-value">${data.grade || 'N/A'}</span>
                </div>
            </div>
            
            ${radarImgHtml}
        `;
        
        // Iterate through all 10 categories
        if (data.category_scores) {
            for (const [cat_key, cat] of Object.entries(data.category_scores)) {
                html += `
                    <div class="print-cat-section">
                        <div class="print-cat-header">
                            <span>${cat.name || cat_key}</span>
                            <span>Score: ${cat.score || 0}%</span>
                        </div>
                `;
                
                const checks = (data.checks && data.checks[cat_key]) || [];
                for (const check of checks) {
                    let detailsHtml = "";
                    if (check.details && Object.keys(check.details).length > 0) {
                        detailsHtml += '<div class="print-check-details">';
                        for (const [k, v] of Object.entries(check.details)) {
                            const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                            
                            if (k === 'metrics' && v && typeof v === 'object') {
                                // Dynamic formatted metrics grid for PageSpeed Insights
                                let mHtml = '<div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px; margin-bottom: 4px;">';
                                for (const [mLabel, mVal] of Object.entries(v)) {
                                    if (mVal && typeof mVal === 'object') {
                                        const scoreColor = mVal.score >= 90 ? '#10b981' : (mVal.score >= 50 ? '#f59e0b' : '#ef4444');
                                        mHtml += `
                                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:4px 6px; text-align:center;">
                                                <div style="font-size:7px; text-transform:uppercase; color:#64748b; font-weight:600;">${mLabel}</div>
                                                <div style="font-size:10px; font-weight:700; color:${scoreColor}; margin-top:1px;">${mVal.value || 'N/A'}</div>
                                            </div>
                                        `;
                                    }
                                }
                                mHtml += '</div>';
                                detailsHtml += `<div class="print-detail-item"><span class="print-detail-label">${label}:</span> ${mHtml}</div>`;
                            } else if (Array.isArray(v)) {
                                if (v.length > 0) {
                                    if (typeof v[0] === 'object') {
                                        const rows = v.slice(0, 10).map(item => {
                                            if (!item) return "";
                                            return Object.entries(item).map(([jk, jv]) => `<strong>${jk.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}:</strong> ${jv}`).join(" — ");
                                        }).filter(Boolean).join("<br>");
                                        detailsHtml += `<div class="print-detail-item"><span class="print-detail-label">${label}:</span> <div class="print-detail-value" style="margin-top: 2px;">${rows}</div></div>`;
                                    } else {
                                        detailsHtml += `<div class="print-detail-item"><span class="print-detail-label">${label}:</span> <div class="print-detail-value">${v.slice(0, 10).join(", ")}</div></div>`;
                                    }
                                }
                            } else if (typeof v === 'object' && v !== null) {
                                // Formatted key-value inline pairs instead of raw JSON stringify
                                let objRows = Object.entries(v).map(([ok, ov]) => {
                                    const oLabel = ok.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                                    return `<strong>${oLabel}:</strong> ${ov}`;
                                }).join(" — ");
                                detailsHtml += `<div class="print-detail-item"><span class="print-detail-label">${label}:</span> <div class="print-detail-value">${objRows}</div></div>`;
                            } else {
                                detailsHtml += `<div class="print-detail-item"><span class="print-detail-label">${label}:</span> <span class="print-detail-value">${v}</span></div>`;
                            }
                        }
                        detailsHtml += '</div>';
                    }
                    
                    html += `
                        <div class="print-check-card ${check.status || 'info'}">
                            <div class="print-check-header">
                                <span class="print-check-name">${check.name || 'Check'}</span>
                                <span class="print-check-status-label ${check.status || 'info'}">${check.status || 'info'}</span>
                            </div>
                            <div class="print-check-msg">${check.message || ''}</div>
                            ${check.recommendation ? `<div class="print-check-rec"><p style="white-space: normal !important; word-break: break-word !important; overflow: visible !important; display: block !important; height: auto !important; margin: 0; padding: 0;"><strong>Recommendation:</strong> ${esc(check.recommendation)}</p></div>` : ""}
                            ${detailsHtml}
                        </div>
                    `;
                }
                html += `</div>`;
            }
        }
        
        el.innerHTML = html;
    } catch (err) {
        console.error("Error building print report:", err);
    }
}
function renderScoreOverview(data) {
    animateCounter("gaugeScore", 0, data.overall_score, 1600);
    const circ = 2 * Math.PI * 85;
    const offset = circ - (data.overall_score / 100) * circ;

    // Update gradient color
    const defs = document.querySelector(".gauge-svg defs");
    const color = getScoreColor(data.overall_score);
    defs.innerHTML = `<linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${color}88"/></linearGradient>`;
    setTimeout(() => document.getElementById("gaugeFill").style.strokeDashoffset = offset, 100);

    document.querySelector(".gauge-score").style.color = color;
    const badge = document.getElementById("gradeBadge");
    badge.textContent = data.grade;
    badge.className = "grade-badge " + getGradeClass(data.grade);

    document.getElementById("scoreUrl").textContent = data.final_url || data.url;
    document.getElementById("metaLoadTime").textContent = data.load_time + "s";
    document.getElementById("metaTotalChecks").textContent = data.summary.total_checks;
    document.getElementById("metaPassed").textContent = data.summary.passed;
    document.getElementById("metaWarnings").textContent = data.summary.warnings;
    document.getElementById("metaFailed").textContent = data.summary.failed;
    document.getElementById("metaInfo").textContent = data.summary.info;
}
function getCategoryIcon(key) {
    const icons = {
        on_page: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        technical: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        keyword: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5"/></svg>`,
        content: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
        social: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
        performance: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        resources: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
        accessibility: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        security: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        links: `<svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    };
    return icons[key] || "";
}


function renderCategoryOverview(scores) {
    const container = document.getElementById("categoryOverview");
    container.innerHTML = "";
    for (const [key, cat] of Object.entries(scores)) {
        const scoreClass = cat.score >= 70 ? "high" : cat.score >= 40 ? "mid" : "low";
        const card = document.createElement("div");
        card.className = "cat-card";
        card.onclick = () => switchTab(key);
        card.innerHTML = `
            <div class="cat-card-top">
                <span class="cat-card-name">${getCategoryIcon(key)} ${cat.name}</span>
                <span class="cat-card-score" style="color:${getScoreColor(cat.score)}">${cat.score}%</span>
            </div>
            <div class="cat-card-bar"><div class="cat-card-fill ${scoreClass}" style="width:0%"></div></div>
            <div class="cat-card-stats">
                <span class="cat-stat"><span class="cat-stat-dot green"></span>${cat.passed} passed</span>
                <span class="cat-stat"><span class="cat-stat-dot amber"></span>${cat.warnings} warn</span>
                <span class="cat-stat"><span class="cat-stat-dot red"></span>${cat.failed} fail</span>
            </div>`;
        container.appendChild(card);
        setTimeout(() => card.querySelector(".cat-card-fill").style.width = cat.score + "%", 150);
    }
}

function renderRecommendations(recs) {
    const panel = document.getElementById("recommendationsPanel");
    const list = document.getElementById("recommendationsList");
    list.innerHTML = "";
    const has = recs.critical.length > 0 || recs.warning.length > 0 || recs.info.length > 0;
    if (!has) { panel.style.display = "none"; return; }
    panel.style.display = "";
    const groups = [
        { key: "critical", label: "Critical Issues", cls: "critical", icon: `<svg class="rec-title-svg text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
        { key: "warning", label: "Warnings", cls: "warning", icon: `<svg class="rec-title-svg text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
        { key: "info", label: "Suggestions", cls: "info", icon: `<svg class="rec-title-svg text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>` },
    ];
    for (const g of groups) {
        if (!recs[g.key].length) continue;
        const el = document.createElement("div");
        el.className = "rec-group";
        el.innerHTML = `<div class="rec-group-title ${g.cls}">${g.icon} ${g.label} (${recs[g.key].length})</div>`;
        for (const r of recs[g.key]) {
            const item = document.createElement("div");
            item.className = `rec-item ${g.cls}`;
            item.innerHTML = `<span class="rec-check-name">${esc(r.check)}:</span><span class="rec-message">${esc(r.message)}</span>`;
            el.appendChild(item);
        }
        list.appendChild(el);
    }
}

function renderTabScores(scores) {
    for (const [key, cat] of Object.entries(scores)) {
        const scoreEl = document.getElementById(`tabScore_${key}`);
        if (scoreEl) scoreEl.textContent = cat.score + "%";
        
        const badgeEl = document.getElementById(`tabBadge_${key}`);
        if (badgeEl) {
            badgeEl.textContent = "";
            badgeEl.className = "tab-badge";
            
            // Show badge if there are failed checks or warnings (improvements needed)
            const totalIssues = (cat.failed || 0) + (cat.warnings || 0);
            if (totalIssues > 0) {
                badgeEl.textContent = totalIssues;
                badgeEl.classList.add("has-issues");
            }
        }
    }
}

/* ── TABS ── */

function switchTab(key) {
    currentTab = key;
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === key));
    renderChecks(key);
    // Scroll tab into view
    const activeTab = document.querySelector(`.tab[data-tab="${key}"]`);
    if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

function renderChecks(key) {
    const container = document.getElementById("tabContent");
    container.innerHTML = "";
    if (!currentReport || !currentReport.checks[key]) return;
    const grid = document.createElement("div");
    grid.className = "checks-grid";
    for (const check of currentReport.checks[key]) {
        grid.appendChild(createCheckCard(check));
    }
    container.appendChild(grid);
}

function filterChecksByStatus(status) {
    if (!currentReport) return;
    
    // De-activate all tabs since we are showing a filtered global view
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    
    const container = document.getElementById("tabContent");
    container.innerHTML = "";
    
    // Collect all checks matching the status
    const matchedChecks = [];
    for (const [catKey, checks] of Object.entries(currentReport.checks)) {
        for (const check of checks) {
            if (check.status === status) {
                // Keep track of which category it belongs to so we can label it nicely
                check._categoryLabel = catKey;
                matchedChecks.push(check);
            }
        }
    }
    
    // Create Header info for filter
    const statusLabels = {
        pass: { label: "Passed", class: "green" },
        warning: { label: "Warnings", class: "amber" },
        fail: { label: "Failed", class: "red" },
        info: { label: "Info", class: "blue" }
    };
    const info = statusLabels[status];
    
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "20px";
    header.style.paddingBottom = "12px";
    header.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
    
    header.innerHTML = `
        <h4 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--text-primary);">
            Showing all checks filtered by: 
            <span style="color: var(--${info.class}); text-transform: uppercase;">${info.label}</span> (${matchedChecks.length})
        </h4>
        <button onclick="switchTab('on_page')" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 600; background: var(--bg-secondary); border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; cursor: pointer; color: var(--text-secondary);">
            Clear Filter
        </button>
    `;
    container.appendChild(header);
    
    if (matchedChecks.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "40px";
        empty.style.textAlign = "center";
        empty.style.color = "var(--text-muted)";
        empty.innerHTML = `No checks found with "${info.label}" status.`;
        container.appendChild(empty);
        return;
    }
    
    const grid = document.createElement("div");
    grid.className = "checks-grid";
    for (const check of matchedChecks) {
        grid.appendChild(createCheckCard(check));
    }
    container.appendChild(grid);
    
    // Scroll smoothly to the results area so the user instantly sees the filtered checks list
    container.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createCheckCard(check) {
    const card = document.createElement("div");
    card.className = "check-card";
    card.onclick = () => card.classList.toggle("expanded");

    const icons = {
        pass: `<svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        warning: `<svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        fail: `<svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info: `<svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };
    let details = "";

    if (check.recommendation) {
        details += `<div class="check-recommendation"><p style="white-space: normal !important; word-break: break-word !important; overflow: visible !important; display: block !important; height: auto !important; margin: 0; padding: 0;"><strong>Recommendation:</strong> ${esc(check.recommendation)}</p></div>`;
    }
    if (check.details && Object.keys(check.details).length > 0) {
        details += '<div class="detail-grid">';
        for (const [k, v] of Object.entries(check.details)) {
            details += renderDetail(k, v);
        }
        details += "</div>";
    }

    card.innerHTML = `
        <div class="check-header">
            <div class="check-status ${check.status}">${icons[check.status] || "•"}</div>
            <div class="check-info">
                <div class="check-name">${esc(check.name)}</div>
                <div class="check-message">${esc(check.message)}</div>
            </div>
            ${check.max_score > 0 ? `<div class="check-score-badge ${check.status}">${check.score}/${check.max_score}</div>` : ""}
            <svg class="check-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        ${details ? `<div class="check-details">${details}</div>` : ""}`;
    return card;
}

function renderDetail(key, value) {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    if (Array.isArray(value)) {
        if (value.length === 0) return "";
        let listItems = "";
        let isObject = typeof value[0] === "object";
        
        for (const item of value) {
            if (isObject) {
                const parts = Object.entries(item).map(([k, v]) => `<strong>${k}:</strong> ${esc(String(v))}`).join(" — ");
                listItems += `<li>${parts}</li>`;
            } else {
                listItems += `<li>${esc(String(item))}</li>`;
            }
        }

        if (value.length > 3) {
            return `
                <div class="detail-item" style="grid-column:1/-1">
                    <details class="collapsible-detail-list">
                        <summary class="detail-label" style="cursor:pointer; display:flex; align-items:center; gap:6px; outline:none; user-select:none; font-weight:600; color:var(--text-secondary);">
                            <span class="toggle-arrow" style="transition:transform 0.2s; display:inline-block; font-size:8px; line-height:1;">▶</span>
                            ${label} (${value.length})
                        </summary>
                        <ul class="detail-list" style="margin-top:8px; padding-left:14px;">
                            ${listItems}
                        </ul>
                    </details>
                </div>
            `;
        } else {
            return `
                <div class="detail-item" style="grid-column:1/-1">
                    <div class="detail-label">${label} (${value.length})</div>
                    <ul class="detail-list" style="padding-left:14px;">
                        ${listItems}
                    </ul>
                </div>
            `;
        }
    }

    if (typeof value === "object" && value !== null) {
        let inner = "";
        for (const [k, v] of Object.entries(value)) inner += renderDetail(k, v);
        return inner;
    }

    const display = typeof value === "string" && value.length > 200 ? value.slice(0, 200) + "…" : value;
    return `<div class="detail-item"><div class="detail-label">${label}</div><div class="detail-value">${esc(String(display))}</div></div>`;
}

/* ── RADAR CHART (Canvas) ── */

function drawRadarChart(scores) {
    const canvas = document.getElementById("radarChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(2.5, window.devicePixelRatio || 1); // Force high DPI rendering for print/PDF
    const w = 380, h = 380;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const cx = w / 2, cy = h / 2, radius = 108;
    const cats = Object.entries(scores);
    const n = cats.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, w, h);

    // Initialize hotspots array for click/hover detection
    canvas.hotspots = [];

    // Draw grid rings (polygons)
    for (let ring = 1; ring <= 4; ring++) {
        const r = (radius / 4) * ring;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.lineWidth = 1;
        if (ring === 4) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        }
        ctx.stroke();
    }

    // Draw axes and labels
    cats.forEach(([key, cat], i) => {
        const angle = startAngle + i * angleStep;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Push labels slightly outwards from the axes to prevent overlap (especially Speed, On-Page, and Resources)
        let labelOffset = 16;
        if (Math.abs(cosAngle) > 0.3) {
            labelOffset = 22; // push left/right labels further out horizontally
        }
        if (key === "on_page") labelOffset = 22; // Push top label higher
        if (key === "performance") labelOffset = 22; // Push bottom label lower
        if (key === "resources") labelOffset = 22; // Push bottom-left label further out
        const lx = cx + (radius + labelOffset) * cosAngle;
        const ly = cy + (radius + labelOffset) * sinAngle;

        // Axis line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * cosAngle, cy + radius * sinAngle);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label alignment and offset based on position to avoid clipping
        ctx.save();
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        
        if (Math.abs(cosAngle) < 0.1) {
            ctx.textAlign = "center";
        } else if (cosAngle > 0) {
            ctx.textAlign = "left";
        } else {
            ctx.textAlign = "right";
        }
        
        if (Math.abs(sinAngle) < 0.1) {
            ctx.textBaseline = "middle";
        } else if (sinAngle > 0) {
            ctx.textBaseline = "top";
        } else {
            ctx.textBaseline = "bottom";
        }

        const shortNames = {
            "on_page": "On-Page",
            "technical": "Technical",
            "keyword": "Keywords",
            "content": "Content",
            "social": "Social",
            "performance": "Speed",
            "resources": "Resources",
            "accessibility": "WCAG",
            "security": "Security",
            "links": "Links",
        };
        const labelText = shortNames[key] || cat.name;
        ctx.fillText(labelText, lx, ly);
        ctx.restore();

        // Save hotspot for text label
        canvas.hotspots.push({
            key: key,
            x: lx,
            y: ly,
            radius: 20
        });
    });

    // Draw data polygon
    ctx.beginPath();
    cats.forEach(([_, cat], i) => {
        const angle = startAngle + i * angleStep;
        const r = (cat.score / 100) * radius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Premium Gradient Fill
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, "rgba(99, 102, 241, 0.28)"); // Soft Indigo
    grad.addColorStop(0.6, "rgba(168, 85, 247, 0.12)"); // Purple accent
    grad.addColorStop(1, "rgba(236, 72, 153, 0.04)"); // Pink glow edge
    ctx.fillStyle = grad;
    ctx.fill();

    // Polygon border with soft shadow glow
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Draw data points (Glowing Nodes)
    cats.forEach(([key, cat], i) => {
        const angle = startAngle + i * angleStep;
        const r = (cat.score / 100) * radius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        // Outer glow halo circle
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
        ctx.fill();

        // Inner solid circle
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = getScoreColor(cat.score);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Save hotspot for the node point
        canvas.hotspots.push({
            key: key,
            x: x,
            y: y,
            radius: 12
        });
    });

    // Attach click and hover events if not already attached
    if (!canvas.listenersAttached) {
        canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (event.clientX - rect.left) * (w / rect.width);
            const my = (event.clientY - rect.top) * (h / rect.height);
            if (canvas.hotspots) {
                for (const spot of canvas.hotspots) {
                    const dx = mx - spot.x;
                    const dy = my - spot.y;
                    if (Math.sqrt(dx*dx + dy*dy) <= spot.radius) {
                        switchTab(spot.key);
                        // Scroll down to the checklist tab content area
                        document.getElementById("tabs").scrollIntoView({ behavior: "smooth", block: "start" });
                        break;
                    }
                }
            }
        });

        canvas.addEventListener("mousemove", (event) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (event.clientX - rect.left) * (w / rect.width);
            const my = (event.clientY - rect.top) * (h / rect.height);
            let hover = false;
            if (canvas.hotspots) {
                for (const spot of canvas.hotspots) {
                    const dx = mx - spot.x;
                    const dy = my - spot.y;
                    if (Math.sqrt(dx*dx + dy*dy) <= spot.radius) {
                        hover = true;
                        break;
                    }
                }
            }
            canvas.style.cursor = hover ? "pointer" : "default";
        });

        canvas.listenersAttached = true;
    }
}

/* ── UTILITIES ── */

function animateCounter(id, start, end, duration) {
    const el = document.getElementById(id);
    const startTime = performance.now();
    const diff = end - start;
    function step(ts) {
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function getScoreColor(score) {
    if (score >= 80) return "#00d68f";
    if (score >= 60) return "#00c8c8";
    if (score >= 40) return "#ffaa00";
    return "#ff3d71";
}

function getGradeClass(grade) {
    const g = grade.toLowerCase().replace("+", "-plus");
    if (g.startsWith("a")) return "grade-a";
    if (g.startsWith("b")) return "grade-b";
    if (g.startsWith("c")) return "grade-c";
    return "grade-f";
}

function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

// Redraw radar on resize
window.addEventListener("resize", () => {
    if (currentReport) drawRadarChart(currentReport.category_scores);
});

/* ══════════════════════════════════════
   SERP PREVIEW
   ══════════════════════════════════════ */

/* ══════════════════════════════════════
   OPEN GRAPH (OG) PREVIEW WIDGET
   ══════════════════════════════════════ */

function renderOpenGraph(data) {
    const el = document.getElementById("ogWidget");
    if (!el) return;
    
    const og = data.og_results;
    if (!og || og.status === "Error") {
        el.style.display = "none";
        return;
    }
    
    el.style.display = "block";
    
    let statusClass = "og-status-missing";
    if (og.status === "Fully Optimized") {
        statusClass = "og-status-optimized";
    } else if (og.status === "Partially Optimized") {
        statusClass = "og-status-partial";
    }
    
    const title = og["og:title"] || "No title defined";
    const desc = og["og:description"] || "Add description metadata to see your sharing preview card.";
    const imgHtml = og["og:image"] ? `<div class="og-preview-image" style="background-image: url('${esc(og["og:image"])}');"></div>` : `<div class="og-preview-image-placeholder">No Open Graph Image Found</div>`;
    const url = og["og:url"] || data.final_url || data.url;
    let domain = "";
    try {
        domain = new URL(url).hostname;
    } catch(e) {
        domain = url;
    }

    el.innerHTML = `
        <h3 class="widget-title">
            <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg> 
            Social Sharing Preview (OG)
            <span class="og-status-badge ${statusClass}">${esc(og.status)}</span>
        </h3>
        <div class="og-card">
            ${imgHtml}
            <div class="og-card-body">
                <div class="og-card-domain">${esc(domain)}</div>
                <div class="og-card-title">${esc(title)}</div>
                <div class="og-card-desc">${esc(desc)}</div>
            </div>
        </div>
    `;
}

/* ══════════════════════════════════════
   KEYWORD DENSITY WIDGET
   ══════════════════════════════════════ */

function renderKeywordDensity(data) {
    const el = document.getElementById("keywordDensityWidget");
    if (!el) return;
    
    const kd = data.keyword_results;
    if (!kd || kd.error || !kd.top_keywords || kd.top_keywords.length === 0) {
        el.style.display = "none";
        return;
    }
    
    el.style.display = "block";
    
    let html = `
        <h3 class="widget-title">
            <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="9" x2="20" y2="9"/>
                <line x1="4" y1="15" x2="20" y2="15"/>
                <line x1="10" y1="3" x2="8" y2="21"/>
                <line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
            Top Keywords & Density
            <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: normal; margin-left: 6px;">(${kd.total_words} words parsed)</span>
        </h3>
        <div class="kd-list">
    `;
    
    for (const item of kd.top_keywords) {
        const isAlert = item.status === "Stuffing Alert";
        const badgeClass = isAlert ? "kd-badge-alert" : "kd-badge-optimal";
        html += `
            <div class="kd-item">
                <div class="kd-item-left">
                    <span class="kd-keyword-name">${esc(item.keyword)}</span>
                    <span class="kd-count-badge">${item.count} times</span>
                </div>
                <div class="kd-item-right">
                    <span class="kd-density-value">${item.density}</span>
                    <span class="kd-status-tag ${badgeClass}">${esc(item.status)}</span>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    el.innerHTML = html;
}

function renderSerpPreview(data) {
    const el = document.getElementById("serpPreview");
    if (!el) return;
    // Find SERP Preview check in on_page checks
    const check = (data.checks.on_page || []).find(c => c.name === "SERP Preview");
    if (!check || !check.details) { el.style.display = "none"; return; }
    const d = check.details;
    el.style.display = "block";
    el.innerHTML = `
        <h3 class="widget-title"><svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> Google SERP Preview</h3>
        <div class="serp-card">
            <div class="serp-url">${esc(d.url_display)}</div>
            <div class="serp-title">${esc(d.title_display || "No title")}</div>
            <div class="serp-desc">${esc(d.description_display || "No description")}</div>
        </div>
        ${d.issues && d.issues.length ? `<div class="serp-issues">${d.issues.map(i => `<span class="serp-issue-tag">${esc(i)}</span>`).join("")}</div>` : ""}
    `;
}

/* ══════════════════════════════════════
   TECH STACK
   ══════════════════════════════════════ */

function renderTechStack(data) {
    const el = document.getElementById("techStack");
    if (!el) return;
    const check = (data.checks.technical || []).find(c => c.name === "Technology Stack");
    if (!check || !check.details || !check.details.technologies) { el.style.display = "none"; return; }
    const tech = check.details.technologies;
    if (Object.keys(tech).length === 0) { el.style.display = "none"; return; }
    el.style.display = "block";
    let html = `<h3 class="widget-title"><svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Technology Stack</h3><div class="tech-grid">`;
    for (const [cat, tools] of Object.entries(tech)) {
        html += `<div class="tech-category"><div class="tech-cat-label">${esc(cat)}</div>`;
        for (const tool of tools) {
            html += `<span class="tech-tag">${esc(tool)}</span>`;
        }
        html += `</div>`;
    }
    html += `</div>`;
    el.innerHTML = html;
}

/* ══════════════════════════════════════
   PAGESPEED INSIGHTS GAUGES
   ══════════════════════════════════════ */

let pageSpeedData = null;

function renderPageSpeed(data) {
    const el = document.getElementById("pageSpeedWidget");
    if (!el) return;
    
    const mobileCheck = (data.checks.performance || []).find(c => c.name === "PageSpeed Insights (Mobile)");
    const desktopCheck = (data.checks.performance || []).find(c => c.name === "PageSpeed Insights (Desktop)");
    
    if (!mobileCheck && !desktopCheck) {
        const legacyCheck = (data.checks.performance || []).find(c => c.name === "PageSpeed Insights");
        if (!legacyCheck) {
            el.style.display = "none";
            return;
        }
        pageSpeedData = { mobile: legacyCheck.details, desktop: null };
    } else {
        pageSpeedData = {
            mobile: mobileCheck ? mobileCheck.details : null,
            desktop: desktopCheck ? desktopCheck.details : null
        };
    }
    
    el.style.display = "block";
    togglePageSpeedStrategy("mobile");
}

function togglePageSpeedStrategy(strategy) {
    const el = document.getElementById("pageSpeedWidget");
    if (!el || !pageSpeedData) return;
    
    const d = pageSpeedData[strategy];
    if (!d) return;
    
    const isMobileActive = strategy === "mobile";
    
    // Render loading indicator if strategy is currently fetching client-side
    if (d.loading) {
        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <h3 class="widget-title" style="margin-bottom:0;">
                    <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    PageSpeed Insights
                </h3>
                <div style="display:flex; background:rgba(255,255,255,0.04); border-radius:12px; padding:2px;">
                    <button onclick="togglePageSpeedStrategy('mobile')" style="border:none; background:${isMobileActive ? '#667eea' : 'transparent'}; color:${isMobileActive ? '#fff' : 'var(--text-secondary)'}; padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:10px; cursor:pointer; outline:none; transition: all 0.2s ease;">Mobile</button>
                    <button onclick="togglePageSpeedStrategy('desktop')" style="border:none; background:${!isMobileActive ? '#667eea' : 'transparent'}; color:${!isMobileActive ? '#fff' : 'var(--text-secondary)'}; padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:10px; cursor:pointer; outline:none; transition: all 0.2s ease;">Desktop</button>
                </div>
            </div>
            <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <div style="width:24px; height:24px; border:2px solid rgba(255,255,255,0.1); border-top:2px solid var(--accent-1); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 10px auto;"></div>
                <span style="font-size:0.8rem; font-weight:600;">Fetching live official PageSpeed metrics from Google...</span>
            </div>
        `;
        return;
    }
    
    const score = d.performance_score;
    const color = score >= 90 ? "#0cce6b" : (score >= 50 ? "#ffa400" : "#ff4e42");
    const dash = Math.round(283 * score / 100);
    
    let metricsHtml = "";
    if (d.metrics) {
        metricsHtml = '<div class="psi-metrics">';
        for (const [label, m] of Object.entries(d.metrics)) {
            const mc = m.score >= 90 ? "psi-good" : (m.score >= 50 ? "psi-mid" : "psi-bad");
            metricsHtml += `
                <div class="psi-metric ${mc}">
                    <div class="psi-metric-header">
                        <span class="psi-metric-dot"></span>
                        <span class="psi-metric-label">${label}</span>
                    </div>
                    <div class="psi-metric-value">${m.value}</div>
                </div>
            `;
        }
        metricsHtml += '</div>';
    }
    
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h3 class="widget-title" style="margin-bottom:0;">
                <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                PageSpeed Insights
            </h3>
            <div style="display:flex; background:rgba(0,0,0,0.04); border-radius:12px; padding:2px;">
                <button onclick="togglePageSpeedStrategy('mobile')" style="border:none; background:${isMobileActive ? '#667eea' : 'transparent'}; color:${isMobileActive ? '#fff' : 'var(--text-secondary)'}; padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:10px; cursor:pointer; outline:none; transition: all 0.2s ease;">Mobile</button>
                <button onclick="togglePageSpeedStrategy('desktop')" style="border:none; background:${!isMobileActive ? '#667eea' : 'transparent'}; color:${!isMobileActive ? '#fff' : 'var(--text-secondary)'}; padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:10px; cursor:pointer; outline:none; transition: all 0.2s ease;">Desktop</button>
            </div>
        </div>
        <div class="psi-container">
            <div class="psi-gauge">
                <svg viewBox="0 0 100 100" class="psi-svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="6"/>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="6"
                        stroke-dasharray="${dash} 283" stroke-linecap="round"
                        transform="rotate(-90 50 50)" style="transition: stroke-dasharray 1s ease;"/>
                </svg>
                <div class="psi-score" style="color:${color}">${score}</div>
            </div>
            ${metricsHtml}
        </div>
    `;
}

/* ══════════════════════════════════════
   SCAN HISTORY (localStorage)
   ══════════════════════════════════════ */

function saveToHistory(data) {
    if (!data.success) return;
    try {
        let history = JSON.parse(localStorage.getItem("seo_scan_history") || "[]");
        history.unshift({
            url: data.final_url || data.url,
            score: data.overall_score,
            grade: data.grade,
            date: new Date().toISOString(),
            checks: data.summary.total_checks,
            passed: data.summary.passed,
            failed: data.summary.failed,
        });
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem("seo_scan_history", JSON.stringify(history));
        renderHistory();
    } catch(e) {}
}

function renderHistory() {
    const el = document.getElementById("scanHistory");
    if (!el) return;
    try {
        const history = JSON.parse(localStorage.getItem("seo_scan_history") || "[]");
        if (history.length === 0) { el.style.display = "none"; return; }
        el.style.display = "block";
        let rows = history.slice(0, 15).map(h => {
            const d = new Date(h.date);
            const dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const gc = h.score >= 80 ? "grade-a" : (h.score >= 60 ? "grade-b" : (h.score >= 40 ? "grade-c" : "grade-f"));
            return `<tr>
                <td class="hist-url" title="${esc(h.url)}">${esc(h.url.replace(/^https?:\/\//, '').substring(0, 35))}</td>
                <td><span class="hist-score ${gc}">${h.score}</span></td>
                <td>${h.grade}</td>
                <td>${dateStr}</td>
            </tr>`;
        }).join("");
        el.innerHTML = `
            <h3 class="widget-title"><svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Scan History</h3>
            <table class="history-table">
                <thead><tr><th>URL</th><th>Score</th><th>Grade</th><th>Date</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch(e) {}
}

/* ══════════════════════════════════════
   COMPETITOR COMPARE
   ══════════════════════════════════════ */

function startComparison() {
    const url1 = document.getElementById("compareUrl1").value.trim();
    const url2 = document.getElementById("compareUrl2").value.trim();
    if (!url1 || !url2) { alert("Please enter both URLs."); return; }
    const btn = document.getElementById("compareBtn");
    const resultEl = document.getElementById("compareResults");
    btn.disabled = true;
    btn.textContent = "Comparing...";
    resultEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">Analyzing both sites... This may take 20-30 seconds.</div>';
    resultEl.style.display = "block";

    fetch("/api/compare", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
        },
        body: JSON.stringify({ url1, url2 }),
    })
    .then(r => r.json())
    .then(data => {
        btn.disabled = false;
        btn.textContent = "Compare";
        if (!data.success) {
            resultEl.innerHTML = `<div style="color:var(--red);padding:16px;">${data.error}</div>`;
            return;
        }
        renderComparison(data, resultEl);
    })
    .catch(() => {
        btn.disabled = false;
        btn.textContent = "Compare";
        resultEl.innerHTML = '<div style="color:var(--red);padding:16px;">Network error.</div>';
    });
}

function renderComparison(data, el) {
    const r1 = data.report1;
    const r2 = data.report2;
    const comp = data.comparison;
    const gc1 = r1.overall_score >= 80 ? "grade-a" : (r1.overall_score >= 60 ? "grade-b" : "grade-c");
    const gc2 = r2.overall_score >= 80 ? "grade-a" : (r2.overall_score >= 60 ? "grade-b" : "grade-c");

    let rows = "";
    for (const [cat, c] of Object.entries(comp)) {
        const w = c.winner;
        const s1c = w === "url1" ? "compare-winner" : (w === "url2" ? "compare-loser" : "");
        const s2c = w === "url2" ? "compare-winner" : (w === "url1" ? "compare-loser" : "");
        rows += `<tr>
            <td>${c.name}</td>
            <td class="${s1c}">${c.score1}%</td>
            <td class="${s2c}">${c.score2}%</td>
            <td>${c.diff > 0 ? "+" + c.diff : c.diff}</td>
        </tr>`;
    }

    el.innerHTML = `
        <div class="compare-header">
            <div class="compare-site">
                <div class="compare-score ${gc1}">${r1.overall_score}</div>
                <div class="compare-url">${esc((r1.final_url || r1.url).replace(/^https?:\/\//, '').substring(0, 30))}</div>
                <div class="compare-grade">${r1.grade}</div>
            </div>
            <div class="compare-vs">VS</div>
            <div class="compare-site">
                <div class="compare-score ${gc2}">${r2.overall_score}</div>
                <div class="compare-url">${esc((r2.final_url || r2.url).replace(/^https?:\/\//, '').substring(0, 30))}</div>
                <div class="compare-grade">${r2.grade}</div>
            </div>
        </div>
        <table class="compare-table">
            <thead><tr><th>Category</th><th>Site 1</th><th>Site 2</th><th>Diff</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// Initialize history on page load
document.addEventListener("DOMContentLoaded", renderHistory);

/* ══════════════════════════════════════
   GOOGLE SEARCH CONSOLE DIAGNOSTICS & AUDITOR
   ══════════════════════════════════════ */

function renderGSCDiagnostics(data) {
    const el = document.getElementById("gscDiagnosticsWidget");
    if (!el) return;
    if (!data.gsc_diagnostics) {
        el.style.display = "none";
        return;
    }
    el.style.display = "block";
    const diag = data.gsc_diagnostics;
    
    let statusClass = "status-pass";
    if (["Not found (404)", "Crawled - currently not indexed", "Duplicate without user-selected canonical"].includes(diag.status)) {
        statusClass = "status-fail";
    } else if (["Page with redirect", "Alternate page with proper canonical tag", "Excluded by 'noindex' tag"].includes(diag.status)) {
        statusClass = "status-warn";
    }
    
    el.innerHTML = `
        <h3 class="widget-title">
            <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            Google Index Status
        </h3>
        <div class="gsc-diag-header">
            <span class="gsc-row-status ${statusClass}">${esc(diag.status)}</span>
        </div>
        <div class="gsc-diag-reason"><strong>Diagnosis:</strong> ${esc(diag.reason)}</div>
        <div class="gsc-diag-suggest"><strong>Suggestion:</strong> ${esc(diag.suggestion)}</div>
    `;
}

function handleGscFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("gscRawData").value = e.target.result;
        analyzeGSCRawData();
    };
    reader.readAsText(file);
}

function analyzeGSCRawData() {
    const raw = document.getElementById("gscRawData").value.trim();
    const resultsEl = document.getElementById("gscResults");
    if (!raw) {
        alert("Please paste GSC data or upload a GSC CSV export file.");
        return;
    }
    
    const lines = raw.split("\n");
    const parsedItems = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith("URL,Status") || line.startsWith("URL\tStatus")) continue;
        
        let parts = [];
        if (line.includes("\t")) {
            parts = line.split("\t");
        } else if (line.includes(",")) {
            parts = line.split(",");
        } else {
            parts = line.split(/\s{2,}/);
        }
        
        let url = parts[0].trim();
        let status = (parts[1] || "Discovered - currently not indexed").trim();
        
        if (!url.startsWith("http")) continue;
        parsedItems.push({ url, status, statusClass: "status-warn", suggest: "", live_status: null });
    }
    
    if (parsedItems.length === 0) {
        alert("Could not parse any valid URLs. Please check format: URL followed by Status.");
        return;
    }
    
    resultsEl.style.display = "block";
    resultsEl.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <div style="width:30px; height:30px; border:3px solid rgba(255,255,255,0.1); border-top:3px solid var(--accent-1); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 15px auto;"></div>
            <strong>Auditing ${parsedItems.length} URLs in real-time...</strong><br>
            Checking live server response and HTTP status codes to verify GSC Coverage correctness.
        </div>
    `;
    
    // Extract unique URLs to query GSC Live audit API
    const urls = parsedItems.map(item => item.url);
    
    fetch("/api/gsc-live-audit", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
        },
        body: JSON.stringify({ urls: urls })
    })
    .then(r => r.json())
    .then(data => {
        const liveResults = data.results || {};
        let total = 0, errors = 0, warnings = 0, passed = 0;
        
        for (const item of parsedItems) {
            total++;
            const live = liveResults[item.url] || { status_code: null, is_redirected: false };
            
            // Check status based on both GSC declaration AND actual live server status code
            let finalStatus = item.status;
            let statusClass = "status-warn";
            let suggest = "";
            
            const liveStatus = live.status_code;
            
            if (liveStatus === 404 || liveStatus === 410) {
                finalStatus = "Not found (404) / Live Dead Link";
                statusClass = "status-fail";
                errors++;
                suggest = "Critical: This page is currently a 404 (Not Found) error. Create a 301 redirect to an active page or clean up internal links pointing to it.";
            } else if (liveStatus === 0) {
                finalStatus = "Dead Link / Timeout";
                statusClass = "status-fail";
                errors++;
                suggest = "Critical: Could not connect to this URL. Verify DNS records, domain registration, and hosting server accessibility.";
            } else if (liveStatus >= 500) {
                finalStatus = `Server error (${liveStatus}) / Live Error`;
                statusClass = "status-fail";
                errors++;
                suggest = `Critical: The server returned an error code (${liveStatus}). Check server error logs, database connections, and memory limits.`;
            } else if (live.is_redirected) {
                finalStatus = "Page with redirect / Live Redirect";
                statusClass = "status-warn";
                warnings++;
                suggest = `This URL redirects to: ${live.final_url}. Update sitemaps and internal links to point directly to the destination URL.`;
            } else {
                // Live page returns 200 OK. Decide based on GSC status
                const gscLower = item.status.toLowerCase();
                if (gscLower.includes("404") || gscLower.includes("not found")) {
                    finalStatus = "Discrepancy: GSC 404 / Live Online (200)";
                    statusClass = "status-pass";
                    passed++;
                    suggest = "GSC lists this as 404, but it is currently online (200 OK). Request indexing in Search Console to resolve the exclusion.";
                } else if (gscLower.includes("redirect")) {
                    finalStatus = "Page with redirect (GSC)";
                    statusClass = "status-warn";
                    warnings++;
                    suggest = "GSC reported a redirect. Verify if the redirect is still active or has been removed.";
                } else if (gscLower.includes("discovered")) {
                    finalStatus = "Discovered - currently not indexed (Live Online)";
                    statusClass = "status-warn";
                    warnings++;
                    suggest = "Crawl budget/indexing delay. Page is online (200 OK). Add internal links from your high-authority pages to boost crawler discovery.";
                } else if (gscLower.includes("crawled")) {
                    finalStatus = "Crawled - currently not indexed (Live Online)";
                    statusClass = "status-fail";
                    errors++;
                    suggest = "Google crawled this live page but chose not to index it. Improve content quality, eliminate thin copy, and make text more helpful.";
                } else if (gscLower.includes("duplicate") || gscLower.includes("user-selected")) {
                    finalStatus = "Duplicate without user canonical (Live Online)";
                    statusClass = "status-fail";
                    errors++;
                    suggest = "Declare an explicit canonical link tag (<link rel='canonical' href='...'>) on this live page to direct search engines.";
                } else if (gscLower.includes("alternate")) {
                    finalStatus = "Alternate page with proper canonical tag";
                    statusClass = "status-pass";
                    passed++;
                    suggest = "Correctly configured. Google recognized your canonical tag and will index the primary version instead of this page.";
                } else {
                    finalStatus = item.status;
                    statusClass = "status-warn";
                    warnings++;
                    suggest = "Live page is online (200 OK). Verify URL accessibility and ensure there are quality internal links referencing this resource.";
                }
            }
            
            item.status = finalStatus;
            item.statusClass = statusClass;
            item.suggest = suggest;
        }
        
        // Render stats and table
        let statsGrid = `
            <div class="gsc-stats-grid">
                <div class="gsc-stat-card gsc-stat-total">
                    <div class="gsc-stat-num">${total}</div>
                    <div class="gsc-stat-title">Total Audited</div>
                </div>
                <div class="gsc-stat-card gsc-stat-fail">
                    <div class="gsc-stat-num">${errors}</div>
                    <div class="gsc-stat-title">Critical Issues</div>
                </div>
                <div class="gsc-stat-card gsc-stat-warn">
                    <div class="gsc-stat-num">${warnings}</div>
                    <div class="gsc-stat-title">Warnings</div>
                </div>
                <div class="gsc-stat-card gsc-stat-pass">
                    <div class="gsc-stat-num">${passed}</div>
                    <div class="gsc-stat-title">Live OK / Resolved</div>
                </div>
            </div>
        `;
        
        let tableRows = "";
        for (const item of parsedItems) {
            tableRows += `
                <tr>
                    <td><a href="${item.url}" target="_blank" style="color:var(--accent-1); word-break:break-all; font-weight:500;">${esc(item.url)}</a></td>
                    <td><span class="gsc-row-status ${item.statusClass}">${esc(item.status)}</span></td>
                    <td><div class="gsc-suggestion-box">${esc(item.suggest)}</div></td>
                </tr>
            `;
        }
        
        resultsEl.innerHTML = `
            ${statsGrid}
            <div class="gsc-table-wrapper">
                <table class="gsc-table">
                    <thead>
                        <tr>
                            <th style="width:35%">URL</th>
                            <th style="width:25%">Coverage Status (Live Aligned)</th>
                            <th style="width:40%">Action & Suggestion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    })
    .catch(err => {
        console.error("Live GSC audit failed, falling back to local text parse", err);
        // Fallback to offline parsing if API fails
        resultsEl.innerHTML = "<div class='error-msg'>Connection error. Please try again.</div>";
    });
}

function showRateLimitOverlay() {
    clearIntervals();
    setLoading(false);
    showSection("hero");
    
    // Disable inputs
    const urlInput = document.getElementById("urlInput");
    const keywordInput = document.getElementById("keywordInput");
    const categorySelect = document.getElementById("categorySelect");
    const analyzeBtn = document.getElementById("analyzeBtn");
    
    if (urlInput) urlInput.disabled = true;
    if (keywordInput) keywordInput.disabled = true;
    if (categorySelect) categorySelect.disabled = true;
    if (analyzeBtn) analyzeBtn.disabled = true;
    
    // Show banner
    const banner = document.getElementById("rateLimitBanner");
    if (banner) banner.style.display = "flex";
    
    // Add Lock Overlay
    const wrapper = document.getElementById("searchFieldsWrapper");
    if (wrapper && !document.getElementById("searchLockOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "searchLockOverlay";
        overlay.className = "search-lock-overlay";
        overlay.innerHTML = `
            <div class="lock-box">
                <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Scanner Locked — Daily Limit Reached</span>
            </div>
        `;
        wrapper.appendChild(overlay);
    }
}

function checkAndTriggerClientSidePageSpeed(data) {
    const mobileCheck = (data.checks.performance || []).find(c => c.name === "PageSpeed Insights (Mobile)");
    const desktopCheck = (data.checks.performance || []).find(c => c.name === "PageSpeed Insights (Desktop)");
    
    let needsMobile = mobileCheck && mobileCheck.details && mobileCheck.details.data_source && mobileCheck.details.data_source.includes("Local Page Auditing");
    let needsDesktop = desktopCheck && desktopCheck.details && desktopCheck.details.data_source && desktopCheck.details.data_source.includes("Local Page Auditing");
    
    if (!needsMobile && !needsDesktop) return;
    
    if (needsMobile) {
        if (!pageSpeedData) pageSpeedData = {};
        if (!pageSpeedData.mobile) pageSpeedData.mobile = {};
        pageSpeedData.mobile.loading = true;
    }
    if (needsDesktop) {
        if (!pageSpeedData) pageSpeedData = {};
        if (!pageSpeedData.desktop) pageSpeedData.desktop = {};
        pageSpeedData.desktop.loading = true;
    }
    
    // Render the loading state immediately
    if (needsMobile) togglePageSpeedStrategy("mobile");
    else if (needsDesktop) togglePageSpeedStrategy("desktop");
    
    const strategiesToFetch = [];
    if (needsMobile) strategiesToFetch.push("mobile");
    if (needsDesktop) strategiesToFetch.push("desktop");
    
    strategiesToFetch.forEach(strategy => {
        const targetUrl = data.url;
        const api_url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
        
        fetch(api_url)
            .then(res => {
                if (res.status === 200) return res.json();
                throw new Error(`Status ${res.status}`);
            })
            .then(resData => {
                const lighthouse = resData.lighthouseResult || {};
                const audits = lighthouse.audits || {};
                const categories = lighthouse.categories || {};
                const perfScore = Math.round((categories.performance || {}).score * 100);
                
                const metricMap = {
                    "first-contentful-paint": "FCP",
                    "largest-contentful-paint": "LCP",
                    "total-blocking-time": "TBT",
                    "cumulative-layout-shift": "CLS",
                    "speed-index": "Speed Index",
                    "interactive": "TTI"
                };
                
                const metrics = {};
                for (const [auditKey, label] of Object.entries(metricMap)) {
                    const audit = audits[auditKey] || {};
                    metrics[label] = {
                        value: audit.displayValue || "N/A",
                        score: Math.round((audit.score || 0) * 100)
                    };
                }
                
                const checkName = `PageSpeed Insights (${strategy === 'mobile' ? 'Mobile' : 'Desktop'})`;
                const check = (currentReport.checks.performance || []).find(c => c.name === checkName);
                if (check) {
                    check.details = {
                        performance_score: perfScore,
                        strategy: strategy,
                        metrics: metrics,
                        data_source: "Google PageSpeed Insights API (Client-Side Live)"
                    };
                    check.result = perfScore >= 90 ? "pass" : (perfScore >= 50 ? "warning" : "fail");
                    check.score = perfScore >= 90 ? 10 : (perfScore >= 50 ? 5 : 2);
                    check.message = `PageSpeed: ${perfScore}/100 (${strategy === 'mobile' ? 'Mobile' : 'Desktop'}). ${perfScore >= 90 ? 'Excellent' : (perfScore >= 50 ? 'Needs improvement' : 'Poor')} performance. [Google PageSpeed Insights API (Client-Side Live)]`;
                }
                
                // Recalculate scores and update UI
                recalculateAllScores();
                
                // Update pageSpeedData
                pageSpeedData[strategy] = {
                    performance_score: perfScore,
                    strategy: strategy,
                    metrics: metrics,
                    data_source: "Google PageSpeed Insights API (Client-Side Live)"
                };
                
                // Re-render PageSpeed gauges, chart and report
                renderPageSpeed(currentReport);
                renderCategoryOverview(currentReport.category_scores);
                renderTabScores(currentReport.category_scores);
                drawRadarChart(currentReport.category_scores);
                buildPrintReport(currentReport);
                saveUpdatedReportToHistory();
            })
            .catch(err => {
                console.error(`Client-side PageSpeed ${strategy} fetch error:`, err);
                // Turn off loading state on failure to fall back quietly
                if (pageSpeedData && pageSpeedData[strategy]) {
                    pageSpeedData[strategy].loading = false;
                }
                renderPageSpeed(currentReport);
            });
    });
}

function recalculateAllScores() {
    if (!currentReport) return;
    
    const categories = {
        "on_page":        { "weight": 0.15 },
        "technical":      { "weight": 0.13 },
        "keyword":        { "weight": 0.13 },
        "content":        { "weight": 0.10 },
        "social":         { "weight": 0.08 },
        "performance":    { "weight": 0.10 },
        "resources":      { "weight": 0.08 },
        "accessibility":  { "weight": 0.07 },
        "security":       { "weight": 0.08 },
        "links":          { "weight": 0.07 }
    };
    
    let overall = 0;
    
    for (const [catKey, catInfo] of Object.entries(categories)) {
        const catChecks = currentReport.checks[catKey] || [];
        let totalScore = 0;
        let maxScore = 0;
        let passed = 0;
        let warnings = 0;
        let failed = 0;
        let info = 0;
        
        catChecks.forEach(c => {
            totalScore += c.score || 0;
            maxScore += c.max_score || 0;
            if (c.status === "pass") passed++;
            else if (c.status === "warning") warnings++;
            else if (c.status === "fail") failed++;
            else if (c.status === "info") info++;
        });
        
        const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        if (currentReport.category_scores[catKey]) {
            currentReport.category_scores[catKey].score = pct;
            currentReport.category_scores[catKey].passed = passed;
            currentReport.category_scores[catKey].warnings = warnings;
            currentReport.category_scores[catKey].failed = failed;
            currentReport.category_scores[catKey].info = info;
        }
        
        overall += pct * catInfo.weight;
    }
    
    overall = Math.round(overall);
    currentReport.overall_score = overall;
    
    // Recalculate grade
    let grade = "F";
    if (overall >= 90) grade = "A+";
    else if (overall >= 80) grade = "A";
    else if (overall >= 70) grade = "B+";
    else if (overall >= 60) grade = "B";
    else if (overall >= 50) grade = "C";
    else if (overall >= 40) grade = "D";
    
    currentReport.grade = grade;
    
    // Update the main score display in DOM
    const scoreVal = document.getElementById("overallScoreVal");
    if (scoreVal) scoreVal.textContent = overall;
    const gradeVal = document.getElementById("overallGradeVal");
    if (gradeVal) gradeVal.textContent = "Grade: " + grade;
}

function saveUpdatedReportToHistory() {
    if (!currentReport) return;
    try {
        let history = JSON.parse(localStorage.getItem("seo_scan_history") || "[]");
        const index = history.findIndex(h => h.url === (currentReport.final_url || currentReport.url));
        if (index !== -1) {
            history[index].score = currentReport.overall_score;
            history[index].grade = currentReport.grade;
            localStorage.setItem("seo_scan_history", JSON.stringify(history));
        }
    } catch (e) {
        console.error("Failed to update history:", e);
    }
}


